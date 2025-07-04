import os
from dotenv import load_dotenv, find_dotenv
from openai import OpenAI

load_dotenv(find_dotenv())

class ConfigManager:
    def __init__(self):
        self.openrouter_api_key = os.environ.get('OPENROUTER_API_KEY')
        self.geospatial_url = "https://msearch.gsi.go.jp/address-search/AddressSearch?q="
        self.model_name = "gpt-4.1-mini"
        self.csv_columns = ["番号", "住所", "名称"]
    
    def get_openai_client(self):
        if not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is not set")
        return OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.openrouter_api_key
        )
    
    def validate_config(self):
        if not self.openrouter_api_key:
            return False, "OPENROUTER_API_KEY is not configured"
        return True, "Configuration is valid"
