from app import app
if __name__ == "__main__":
    app.run(host=config.SERVER_CONFIG['host'], port=config.SERVER_CONFIG['port'])
