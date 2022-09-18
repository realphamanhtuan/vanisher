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


def DecodeBase64Image(self, image_string):
    try:
        image = base64.b64decode(image_string)
        img = Image.open(io.BytesIO(image))
    except Exception:
        Log('file is not valid base64 image')
        return None
    
    if img.format.lower() == "png":
        width, height = img.size
        if width < config.MAX_IMAGE_SIZE and height < config.MAX_IMAGE_SIZE:
            return img
        else:
            Log('image size exceeded, width and height must be less than 800 pixels')
            return None
    else:
        Log('Image is not valid, only \'base64\' png images are valid')
        return None

def random_string(size=24, chars=string.ascii_letters + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

@app.route("/api/upload", methods=['POST'])
def Upload():
    gt64 = request.args.get("gt")
    mask64 = request.args.get("mask")
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if gt64 == '' or gt64 == None or mask64 == '' or mask64 == None:
        flash('No selected file')
        return json.dumps(ERRORS_INPUT)
    
    gt = DecodeBase64Image(gt64)
    mask = DecodeBase64Image(mask64)
    
    if gt == None or mask == None:
        return json.dumps(ERRORS_INPUT)
    else:
        gt_path, mask_path = random_string(), random_string()
        gt.save(os.path.join(config.IMG_PATH, gt_path), format="png")
        mask.save(os.path.join(config.IMG_PATH, mask_path), format="png")
        id = db.QueueAnImage(gt_path, mask_path, "127.0.0.1", "chrome")
        if id < 0:
            Log("Got negative id when adding entries to images table.")
            return json.dumps(ERRORS_SERVER)
        else:
            res = dict(ERRORS_SUCCESS)
            res['id'] = id;
            return json.dump(res)

@app.route("/api/getstatus", methods=['POST'])
def GetStatus():
    id = str(request.args.get("id"))
    return db.GetImageStatus(id)

@app.route("/workerapi/queryImage", methods=['POST'])
def QueryAnImage():
    model_identifier = request.args.get("model_identifier", None)
    if model_identifier == None:
        return json.dumps(dict(ERRORS_INPUT))

    res = db.QueryAnImage(request.data[model_identifier])
    if res == None:
        return json.dumps(dict(ERRORS_NOT_FOUND))
    else: 
        arr = dict(ERRORS_SUCCESS)
        arr['data'] = res
        return json.dumps(arr)

if __name__ == "__main__":
    Log(QueryAnImage())
