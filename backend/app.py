import config
import os
from debug import *
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import string, random
from db import VanisherDB
from errors import *
import json
import flask_cors

global db 
db = VanisherDB()

app = Flask(__name__, static_url_path="/static", static_folder="/var/vanisher/static")

#allows CORS 
flask_cors.CORS(app)

app.config['UPLOAD_FOLDER'] = config.IMG_PATH

import base64
import io
from PIL import Image


def DecodeBase64Image(image_string):
    image_string = image_string.split(",")[-1]
    try:
        image = base64.b64decode(image_string)
        img = Image.open(io.BytesIO(image))
    except Exception:
        Log('file is not valid base64 image')
        return None
    
    if img.format.lower() == "png":
        width, height = img.size
        if width <= config.MAX_IMAGE_SIZE and height <= config.MAX_IMAGE_SIZE:
            return img
        else:
            Log('image size exceeded, width and height must be less than', config.MAX_IMAGE_SIZE, 'pixels', width, height)
            return None
    else:
        Log('Image is not valid, only \'base64\' png images are valid')
        return None

def random_string(size=24, chars=string.ascii_letters + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

@app.route("/", methods=['GET'])
def GetRoot():
	return redirect("/static/index.html", code=302)

@app.route("/api/upload", methods=['POST'])
def Upload():
    data = request.get_json()
    
    if (not 'gt' in data) or (not 'mask' in data):
        Log("gt or mask was not found in request");
        return json.dumps(ERRORS_INPUT)

    gt64 = data["gt"]
    mask64 = data["mask"]

    if gt64 == '' or gt64 == None or mask64 == '' or mask64 == None:
        Log("gt or mask was found in request but was empty");
        return json.dumps(ERRORS_INPUT)

    gt = DecodeBase64Image(gt64)
    mask = DecodeBase64Image(mask64)
    
    if gt == None or mask == None:
        return json.dumps(ERRORS_INPUT)
    else:
        gt_path, mask_path = random_string() + ".png", random_string() + ".png"
        gt.save(os.path.join(config.IMG_PATH, gt_path), format="png")
        mask.save(os.path.join(config.IMG_PATH, mask_path), format="png")
        id = db.QueueAnImage(gt_path, mask_path, "127.0.0.1", "chrome")
        if id < 0:
            Log("Got negative id when adding entries to images table.")
            return json.dumps(ERRORS_SERVER)
        else:
            res = dict(ERRORS_SUCCESS)
            res['id'] = id;
            return json.dumps(res)

@app.route("/api/getStatus", methods=['POST'])
def GetStatus():
    data = request.get_json()
    id = str(data["id"])
    return db.GetImageStatus(id)

@app.route("/workerapi/queryImage", methods=['POST'])
def QueryAnImage():
    data = request.get_json()
    Log(data)
    model_identifier = data["model_identifier"]
    if model_identifier == None:
        return json.dumps(dict(ERRORS_INPUT))

    res = db.QueryAnImage(model_identifier)
    if res == None:
        return json.dumps(dict(ERRORS_NOT_FOUND))
    else: 
        arr = dict(ERRORS_SUCCESS)
        arr['data'] = res
        return json.dumps(arr)

@app.route("/workerapi/completeImage", methods=['POST'])
def CompleteAnImage():
    data = request.get_json()
    Log(data)
    if 'id' not in data or data["id"] == "":
        Log("No ID found")
        return json.dumps(ERRORS_INPUT)
    id = data["id"]

    if 'model_identifier' not in data or data["model_identifier"] == "":
        Log("No model_identifier found")
        return json.dumps(ERRORS_INPUT)
    model_identifier = data["model_identifier"]

    if 'outImage' not in data or data["outImage"] == "":
        Log("No outImage found")
        return json.dumps(ERRORS_INPUT)

    outImageB64 = data["outImage"]
    outImage = DecodeBase64Image(outImageB64)

    if outImage == None:
        Log("outImage invalid")
        return json.dumps(ERRORS_INPUT)

    outName = random_string() + ".png"
    outPath = os.path.join(config.IMG_PATH, outName)
    outImage.save(outPath)

    if db.CompleteAnImage(id, model_identifier, outName):
        return json.dumps(ERRORS_SUCCESS)
    else:
        return json.dumps(ERRORS_SERVER)

if __name__ == "__main__":
    app.secret_key = "BpEvyspjTXox7YorJzn8D5JKQpL6pMc0QiAveajsVzTFQ27rtFn5KMbcxNSOk0bK"
    app.run(host="0.0.0.0", port=5000)
