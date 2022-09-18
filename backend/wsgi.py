from app import app
if __name__ == "__main__":
    app.secret_key = "BpEvyspjTXox7YorJzn8D5JKQpL6pMc0QiAveajsVzTFQ27rtFn5KMbcxNSOk0bK"
    app.run(host=config.SERVER_CONFIG['host'], port=config.SERVER_CONFIG['port'])
