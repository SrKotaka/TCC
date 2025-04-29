import requests, os, time

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def get_weather_data(lat, lon, tentativas=3):
    url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}"
    for _ in range(tentativas):
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            return [data["current"]["temp_c"], data["current"]["humidity"], data["current"]["wind_kph"]]
        except Exception:
            time.sleep(2)
    return None
