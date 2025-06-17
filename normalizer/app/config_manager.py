import json
from typing import Dict, Any, List

class ConfigManager:
    def __init__(self):
        self.default_templates = {
            "東京都": {
                "中央区": {
                    "columns": ["番号", "掲示場番号", "住所", "名称"],
                    "mapping": {
                        "number": 2,
                        "address": 3,
                        "name": 4,
                        "lat": "lat",
                        "long": "long"
                    }
                },
                "新宿区": {
                    "columns": ["番号", "掲示場番号", "住所", "名称"],
                    "mapping": {
                        "number": 2,
                        "address": 3,
                        "name": 4,
                        "lat": "lat",
                        "long": "long"
                    }
                }
            }
        }
    
    def get_template(self, prefecture: str, city: str) -> Dict[str, Any]:
        return self.default_templates.get(prefecture, {}).get(city, {
            "columns": ["番号", "住所", "名称"],
            "mapping": {
                "number": 1,
                "address": 2,
                "name": 3,
                "lat": "lat",
                "long": "long"
            }
        })
    
    def get_available_templates(self) -> Dict[str, List[str]]:
        result = {}
        for prefecture, cities in self.default_templates.items():
            result[prefecture] = list(cities.keys())
        return result
    
    def create_config(self, prefecture: str, city: str, column_mapping: Dict[str, int],
                     api_key: str, sleep_ms: int = 200, 
                     normalize_digits: bool = False) -> Dict[str, Any]:
        format_config = {
            "prefecture": prefecture,
            "city": city
        }
        
        for field_name, column_index in column_mapping.items():
            if field_name in ["number", "address", "name"]:
                format_config[field_name] = f"{{{column_index}}}"
            elif field_name in ["lat", "long"]:
                format_config[field_name] = f"{{{field_name}}}"
        
        return {
            "api": {
                "key": api_key,
                "sleep": sleep_ms
            },
            "format": format_config,
            "normalize_address_digits": normalize_digits
        }
    
    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        errors = []
        
        if "format" not in config:
            errors.append("設定に'format'セクションが必要です")
            return errors
        
        format_config = config["format"]
        required_fields = ["prefecture", "city", "address"]
        
        for field in required_fields:
            if field not in format_config:
                errors.append(f"'{field}'フィールドが必要です")
        
        if any("{lat}" in str(v) or "{long}" in str(v) for v in format_config.values()):
            if "api" not in config or "key" not in config["api"]:
                errors.append("緯度経度を取得するにはAPIキーが必要です")
        
        return errors
