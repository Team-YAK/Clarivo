import asyncio
import logging

def _project_doc(doc, projection):
    if not projection:
        return doc
    include_keys = {k for k, v in projection.items() if v and k != "_id"}
    exclude_id = projection.get("_id") == 0
    if not include_keys and not exclude_id:
        return doc

    out = {}
    if not exclude_id and "_id" in doc:
        out["_id"] = doc["_id"]

    for key in include_keys:
        if "." in key:
            parts = key.split(".")
            src = doc
            ok = True
            for p in parts:
                if isinstance(src, dict) and p in src:
                    src = src[p]
                else:
                    ok = False
                    break
            if ok:
                dst = out
                for p in parts[:-1]:
                    dst = dst.setdefault(p, {})
                dst[parts[-1]] = src
        elif key in doc:
            out[key] = doc[key]
    return out

class MockCursor:
    def __init__(self, data):
        self.data = data
        self._limit = None
        self._sort = None

    def sort(self, key, direction=1):
        # Direction 1 asc, -1 desc
        self.data.sort(key=lambda x: x.get(key, 0), reverse=(direction == -1))
        return self

    def limit(self, n):
        self._limit = n
        return self

    async def to_list(self, length=100):
        await asyncio.sleep(0.01)
        res = self.data
        if self._limit:
            res = res[:self._limit]
        return res[:length]

class MockCollection:
    def __init__(self, name):
        self.name = name
        self._data = {} # Indexed by _id

    async def find_one(self, query, projection=None, sort=None):
        import copy
        doc = await self._find_one_raw(query, projection, sort)
        if not doc:
            return None
        return copy.deepcopy(_project_doc(doc, projection))

    async def _find_one_raw(self, query, projection=None, sort=None):
        """Internal: returns the original stored doc reference (for mutations)."""
        await asyncio.sleep(0.01)
        # Sort first if present (by getting all matches)
        matches = []
        for doc in self._data.values():
            match = True
            for k, v in query.items():
                if isinstance(v, dict) and "$gte" in v:
                    if doc.get(k) < v["$gte"]: match = False
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                matches.append(doc)
        
        if not matches: return None
        
        if sort:
            # sort is list of tuples like [('timestamp', -1)]
            for key, direction in reversed(sort):
                matches.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
        
        return matches[0]

    def find(self, query=None, projection=None):
        query = query or {}
        matches = []
        for doc in self._data.values():
            match = True
            for k, v in query.items():
                val = doc.get(k)
                if isinstance(v, dict) and "$in" in v:
                    if val not in v["$in"]: match = False
                elif val != v:
                    match = False
                    break
            if match:
                matches.append(_project_doc(doc, projection))
        return MockCursor(matches)

    async def count_documents(self, query):
        cursor = self.find(query)
        res = await cursor.to_list(1000)
        return len(res)

    async def insert_one(self, doc):
        await asyncio.sleep(0.01)
        if "_id" not in doc:
            import uuid
            doc["_id"] = str(uuid.uuid4())
        self._data[doc["_id"]] = doc
        return doc

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)

    async def replace_one(self, query, replacement, upsert=False):
        if "_id" in query:
            self._data[query["_id"]] = replacement
        elif upsert:
            await self.insert_one(replacement)

    async def update_one(self, query, update, upsert=False):
        # Very simplified mongo update simulation
        doc = await self._find_one_raw(query)
        if not doc:
            if upsert and "$set" in update:
                # Create minimal doc from query + $set
                new_doc = dict(query)
                new_doc.update(update["$set"])
                await self.insert_one(new_doc)
            return
        
        if "$set" in update:
            for k, v in update["$set"].items():
                # handle dot notation basic (interface_settings.shortcut_threshold)
                if "." in k:
                    parts = k.split(".")
                    sub = doc
                    for p in parts[:-1]:
                        if p not in sub: sub[p] = {}
                        sub = sub[p]
                    sub[parts[-1]] = v
                else:
                    doc[k] = v
        
        if "$inc" in update:
            for k,v in update["$inc"].items():
                 # basic dot notation
                if "." in k:
                      parts = k.split(".")
                      sub = doc
                      for p in parts[:-1]:
                          if p not in sub: sub[p] = {}
                          sub = sub[p]
                      field = parts[-1]
                      sub[field] = sub.get(field, 0) + v
                else:
                    doc[k] = doc.get(k, 0) + v

        if "$push" in update:
            for k, v in update["$push"].items():
                if k not in doc:
                    doc[k] = []
                if isinstance(v, dict) and "$each" in v:
                    items = v["$each"]
                    doc[k].extend(items)
                    # Handle $slice
                    if "$slice" in v:
                        slice_val = v["$slice"]
                        if slice_val < 0:
                            doc[k] = doc[k][slice_val:]
                        else:
                            doc[k] = doc[k][:slice_val]
                else:
                    doc[k].append(v)

        if "$pull" in update:
            for k, v in update["$pull"].items():
                if k in doc and isinstance(doc[k], list):
                    if isinstance(v, dict):
                        # Filter matching documents from array
                        doc[k] = [item for item in doc[k] if not all(
                            item.get(fk) == fv for fk, fv in v.items()
                        )]
                    else:
                        doc[k] = [item for item in doc[k] if item != v]

        if "$unset" in update:
            for k in update["$unset"]:
                if "." in k:
                    parts = k.split(".")
                    sub = doc
                    for p in parts[:-1]:
                        if p not in sub:
                            break
                        sub = sub[p]
                    else:
                        sub.pop(parts[-1], None)
                else:
                    doc.pop(k, None)

    async def delete_one(self, query):
        doc = await self._find_one_raw(query)
        if doc and "_id" in doc:
            del self._data[doc["_id"]]
    
    async def delete_many(self, query):
        if not query:
            self._data = {}
            return type('obj', (object,), {'deleted_count': 0})
        # Not bothering with full filter
        return type('obj', (object,), {'deleted_count': 0})

    async def create_index(self, *args, **kwargs):
        pass
