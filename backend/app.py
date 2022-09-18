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

def GetFilesExtension(filename):
    return filename.rsplit('.', 1)[-1].lower()
def IsAnImagesName(filename):
    return '.' in filename and \
            GetFilesExtension(filename) in {'jpg', 'png'}

def random_string(size=24, chars=string.ascii_letters + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

@app.route("/api/upload", methods=['POST'])
def Upload():
    print(random_string())
    if 'gt' not in request.files or 'mask' not in request.files:
        return json.dumps(ERRORS_INPUT)
    gt = request.files['gt']
    mask = request.files['mask']
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if gt.filename == '' or mask.filename == '':
        flash('No selected file')
        return json.dumps(ERRORS_INPUT)
    elif not IsAnImagesName(gt.filename) or not IsAnImagesName(mask.filename):
        return json.dumps(ERRORS_INPUT)
    else:
        gt_path, mask_path = random_string(), random_string()
        gt.save(os.path.join(config.IMG_PATH, gt_path))
        mask.save(os.path.join(config.IMG_PATH, mask_path))
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
    model_identifier = request.data.get("model_identifier", None)
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
