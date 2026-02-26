import json
import os
import asyncio
from typing import List, Dict, Any, Optional

class MockUpdateResult:
    def __init__(self, matched_count, modified_count):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = None

class AsyncMockCursor:
    def __init__(self, data: List[Dict[str, Any]]):
        self._data = data

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, str):
            key = key_or_list
            reverse = direction == -1
        else:
            # simple support for list of tuples [('order', 1)]
            key = key_or_list[0][0]
            reverse = key_or_list[0][1] == -1
            
        self._data.sort(key=lambda x: x.get(key, 0), reverse=reverse)
        return self

    async def to_list(self, length: int):
        if length is None:
            return self._data
        return self._data[:length]

class AsyncMockCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    def _get_collection_data(self) -> List[Dict[str, Any]]:
        return self.db.data.get(self.name, [])

    def _save_collection_data(self, data: List[Dict[str, Any]]):
        self.db.data[self.name] = data
        self.db._save()

    def _matches(self, doc, filter_query):
        for k, v in filter_query.items():
            if k == "_id": # ignore implementation detail _id
                 continue 
            
            val = doc.get(k)
            if isinstance(v, dict) and "$in" in v:
                if val not in v["$in"]:
                    return False
            elif val != v:
                return False
        return True

    def _apply_projection(self, doc, projection):
        if not projection:
            return doc
        
        # Simple projection handling
        is_inclusion = any(v == 1 for k, v in projection.items() if k != "_id")
        
        if not is_inclusion:
            # Exclusion mode
            new_doc = doc.copy()
            for k, v in projection.items():
                if v == 0:
                    new_doc.pop(k, None)
            return new_doc
        else:
            # Inclusion mode
            new_doc = {}
            for k, v in projection.items():
                if v == 1:
                    if k in doc:
                        new_doc[k] = doc[k]
                    elif k == "_id":
                        # If project asks for _id 1 but it's not in doc, skip or use None
                        pass
            return new_doc

    async def find_one(self, filter_query, projection=None):
        data = self._get_collection_data()
        for doc in data:
            if self._matches(doc, filter_query):
                return self._apply_projection(doc, projection)
        return None

    def find(self, filter_query, projection=None):
        data = self._get_collection_data()
        filtered = []
        for doc in data:
            if self._matches(doc, filter_query):
                filtered.append(self._apply_projection(doc, projection))
        return AsyncMockCursor(filtered)

    async def insert_one(self, document):
        data = self._get_collection_data()
        data.append(document)
        self._save_collection_data(data)
        return True

    async def insert_many(self, documents):
        data = self._get_collection_data()
        data.extend(documents)
        self._save_collection_data(data)
        return True

    async def count_documents(self, filter_query):
        data = self._get_collection_data()
        count = 0
        for doc in data:
            if self._matches(doc, filter_query):
                count += 1
        return count

    async def update_one(self, filter_query, update):
        data = self._get_collection_data()
        for doc in data:
            if self._matches(doc, filter_query):
                modified = False
                # Apply $set
                if "$set" in update:
                    for k, v in update["$set"].items():
                        if doc.get(k) != v:
                            doc[k] = v
                            modified = True
                
                # Apply $push
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in doc:
                            doc[k] = []
                        if isinstance(doc[k], list):
                            doc[k].append(v)
                            modified = True

                # Apply $pull
                if "$pull" in update:
                    for k, v in update["$pull"].items():
                        if k in doc and isinstance(doc[k], list):
                            old_len = len(doc[k])
                            if isinstance(v, dict):
                                # match items that contain all key-values from v
                                doc[k] = [item for item in doc[k] if not all(item.get(sub_k) == sub_v for sub_k, sub_v in v.items())]
                            else:
                                doc[k] = [item for item in doc[k] if item != v]
                            if len(doc[k]) != old_len:
                                modified = True

                if modified:
                    self._save_collection_data(data)
                    return MockUpdateResult(1, 1)
                else:
                    return MockUpdateResult(1, 0)
        return MockUpdateResult(0, 0)

    async def update_many(self, filter_query, update):
        data = self._get_collection_data()
        updated_count = 0
        for doc in data:
            if self._matches(doc, filter_query):
                # Apply $set
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                
                # Apply $push
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in doc:
                            doc[k] = []
                        if isinstance(doc[k], list):
                            doc[k].append(v)

                # Apply $pull
                if "$pull" in update:
                    for k, v in update["$pull"].items():
                        if k in doc and isinstance(doc[k], list):
                            if isinstance(v, dict):
                                doc[k] = [item for item in doc[k] if not all(item.get(sub_k) == sub_v for sub_k, sub_v in v.items())]
                            else:
                                doc[k] = [item for item in doc[k] if item != v]
                
                updated_count += 1
        if updated_count > 0:
            self._save_collection_data(data)
        return MockUpdateResult(updated_count, updated_count)

    async def delete_one(self, filter_query):
        data = self._get_collection_data()
        for i, doc in enumerate(data):
            if self._matches(doc, filter_query):
                del data[i]
                self._save_collection_data(data)
                return True
        return False

    async def delete_many(self, filter_query):
        data = self._get_collection_data()
        new_data = [doc for doc in data if not self._matches(doc, filter_query)]
        deleted_count = len(data) - len(new_data)
        self._save_collection_data(new_data)
        return deleted_count

class AsyncMockDatabase:
    def __init__(self, client, name):
        self.client = client
        self.name = name
        self.data = client.data.get(name, {})

    def __getitem__(self, name):
        return AsyncMockCollection(self, name)
    
    def __getattr__(self, name):
        return self[name]

    def _save(self):
        self.client.data[self.name] = self.data
        self.client._save()

class AsyncMockClient:
    def __init__(self, filepath="local_db.json"):
        self.filepath = filepath
        self.data = {}
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    self.data = json.load(f)
            except:
                self.data = {}
        else:
            self.data = {}

    def _save(self):
        with open(self.filepath, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def __getitem__(self, name):
        return AsyncMockDatabase(self, name)

    def close(self):
        pass
