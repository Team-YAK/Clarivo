def path_to_key(path_list: list[str], mode: str = "tree") -> str:
    """
    Convert a list of path segments into a standard string key format.
    Example: ["food", "dessert", "tiramisu"] -> "food→dessert→tiramisu"
    Example: ["running", "sun"] (mode="composer") -> "composer→running→sun"
    """
    if not path_list:
        return ""
    path_str = "→".join(path_list)
    if mode == "composer":
        return f"composer→{path_str}"
    # Ensure custom prefix is preserved if it exists
    if mode == "custom":
        return f"custom→{path_str}"
    return path_str
