import json
import logging
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
if os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

llm = ChatOpenAI(
    model_name="gpt-4o-mini",
    temperature=0.5,
    api_key=os.getenv("OPENAI_API_KEY")
)

async def context_agent(raw_db_logs: str) -> str:
    sys_msg = SystemMessage(content="You are a Context Analyzer. Skim database histories and output a highly dense summary of recent interactions.")
    hu_msg = HumanMessage(content=f"Analyze raw db logs: {raw_db_logs}. Summarize what the user has done recently.")
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content

async def personalization_agent(user_profile: str) -> str:
    sys_msg = SystemMessage(content="You are a Personalization Profiler. Build a compact representation of the user based on preferences and known profile.")
    hu_msg = HumanMessage(content=f"Analyze user details: {user_profile}. Build a dense behavioral summary.")
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content

async def generation_agent(context_summary: str, profile_summary: str, current_path: str) -> str:
    sys_msg = SystemMessage(content="You are an Options Generator. Produce 4-6 highly relevant, non-generic button options based on context, personalization, and current user path.")
    hu_msg = HumanMessage(content=(
        f"Context summary: {context_summary}\n"
        f"Profile summary: {profile_summary}\n"
        f"Current path: {current_path}\n"
        "Generate 4-6 specific, relevant options for where they might want to navigate next. "
        "Output must be a JSON object strictly containing 'quick_option' (a single object with 'label' and 'icon') and 'options' (a list of objects with 'label' and 'icon'). "
        "The 'icon' property must be a lowercase snake_case string."
    ))
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content

async def manager_agent(generated_json: str, current_path: str) -> str:
    sys_msg = SystemMessage(content="You are a Pipeline Manager. Oversee option generation and ensure strict final JSON output format with 0% hallucinations.")
    hu_msg = HumanMessage(content=(
        f"Review this generated options json: {generated_json}\n"
        "Fix any broken formatting. Strip all markdown (like ```json) and return absolutely nothing but the inner raw JSON syntax. "
        "Ensure there are exactly 4-6 option items in the array, and ensure quick_option is an OBJECT with 'label' and 'icon', NOT a string. "
        f"If the generation fundamentally failed to output JSON, fall back to generating brand new pure OpenAI commonsense context-aware options based on the path: {current_path}."
    ))
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content

async def run_crew_pipeline(current_path: list[str], context_data: dict) -> dict:
    path_str = " > ".join(current_path) if current_path else "root"
    
    raw_db_logs = json.dumps({
        "recent_paths": context_data.get("recent_paths", []),
        "frequencies": context_data.get("top_paths", []),
        "utterances": context_data.get("conversation_utterances", [])
    })
    
    user_profile = json.dumps({
        "preferences": context_data.get("preferences", ""),
        "glossary": context_data.get("glossary_rules", [])
    })
    
    # 1. Run contextual agents fully concurrently
    context_res, profile_res = await asyncio.gather(
        context_agent(raw_db_logs),
        personalization_agent(user_profile)
    )
    
    # 2. Fire Generation agent strictly afterwards
    generated_json = await generation_agent(context_res, profile_res, path_str)
    
    # 3. Escalate up to the format Manager validation layer
    final_output = await manager_agent(generated_json, path_str)
    
    raw_str = final_output.strip()
    if raw_str.startswith("```json"):
        raw_str = raw_str[7:]
    if raw_str.startswith("```"):
        raw_str = raw_str[3:]
    if raw_str.endswith("```"):
        raw_str = raw_str[:-3]
        
    try:
        return json.loads(raw_str.strip())
    except Exception as e:
        logger.error(f"Manager returned invalid JSON: {raw_str} error: {e}")
        raise ValueError("Manager failed to produce valid JSON options format.")
