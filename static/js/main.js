const IMG_EMPTY = 0, IMG_CHOSEN = 1, IMG_UPLOADING = 2, IMG_COMPLETE = 3;
var phase = IMG_EMPTY;
//global variables
var gtCanvas, maskCanvas;
var imagefile, leftButton, rightButton;
var lastDownloadableImage;
var loadingDiv, loadingLabel;

//initialization
console.log("Initializing Vanisher");
imagefile = document.getElementById("imagefile");
leftButton = document.getElementById("leftButton");
rightButton = document.getElementById("rightButton");
gtCanvas = document.getElementById("gtCanvas")
maskCanvas = document.getElementById("maskCanvas");
loadingDiv = document.getElementById("loading-div");
loadingLabel = document.getElementById("loading-label");

MaskEditor.InitializeMaskEditor(maskCanvas);
MaskEditor.ClearCanvas();

console.log("Adding event listeners");
imagefile.addEventListener("change", (ev) => {
    if (phase != IMG_UPLOADING){
        Refresh();
        console.log("Changed image. Reloading source and initializing blank canvas");
        var file = ev.target.files[0];
        // Ensure it's an image
        if(file != undefined && file.type != undefined && file.type.match(/image.*/)) {
            console.log('An image has been loaded');
            ReloadImage(file);
            MaskEditor.ClearCanvas();
            SetPhase(IMG_CHOSEN);
        } else {
            MsgBox("No image or an invalid one has been chosen. Try again.");
        }
    }
});
leftButton.addEventListener("click", LeftButtonClick);
rightButton.addEventListener("click", RightButtonClick);
document.getElementById("image-billboard").addEventListener("click", ImageBillboardClick);

//control section
function ShowChooseImageDialog(){
    imagefile.value = null;
    imagefile.click();    
}
function ImageBillboardClick(){
    if (phase == IMG_EMPTY)
        ShowChooseImageDialog();
}
function LeftButtonClick(ev){
    console.log("left");
    if (phase != IMG_UPLOADING)
        ShowChooseImageDialog();
}
function RightButtonClick(ev){
    console.log("right");
    if (phase == IMG_CHOSEN)
        UploadImagesToProcess();
    else if (phase == IMG_COMPLETE){
        var a = document.createElement('a');
        a.setAttribute("href", lastDownloadableImage);
        a.setAttribute("download", "Vanisher_Output.png");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

//update section
function SetPhase(newPhase){
    phase = newPhase;
    Refresh();
}
function Refresh(){
    console.log("Refreshing state = ", phase);
    if (phase == IMG_CHOSEN){
        MaskEditor.UpdateDrawingState(true);
    } else {
        MaskEditor.UpdateDrawingState(false);
    }
    if (phase == IMG_COMPLETE) {
        rightButton.innerHTML = "Save Output";
    } else {
        rightButton.innerHTML = "Upload";
    }
    if (phase == IMG_UPLOADING){
        loadingDiv.style.visibility = "visible";
    } else {
        loadingDiv.style.visibility = "hidden";
    }
}

//processing section
function ReloadImage(inFile){
    // Load the image
    var reader = new FileReader();
    reader.onload = function (readerEvent) {
        var image = new Image();
        image.onload = function (imageEvent) {

            // Resize the image
            var max_size = MAX_IMG_SIZE,// TODO : pull max size from a site config
                width = image.width,
                height = image.height;
            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    height = Math.floor(height / 8.0) * 8;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    width = Math.floor(width / 8.0) * 8;
                    height = max_size;
                }
            }
            gtCanvas.width = maskCanvas.width = width;
            gtCanvas.height = maskCanvas.height = height;
            console.log("Setting canvas size to (w, h): (" + width + ", " + height, ") and position to (left, top): (" + ((MAX_IMG_SIZE - width) / 2) + ", " + ((MAX_IMG_SIZE - height) / 2) + ")");
            gtCanvas.style.marginTop = maskCanvas.style.marginTop = (MAX_IMG_SIZE - height) / 2 + "px";
            gtCanvas.style.marginLeft = maskCanvas.style.marginLeft = (MAX_IMG_SIZE - width) / 2 + "px";
            gtCanvas.getContext('2d').drawImage(image, 0, 0, width, height);
        }
        image.src = readerEvent.target.result;
    }
    reader.readAsDataURL(inFile);
}
function UploadImagesToProcess(){
    SetPhase(IMG_UPLOADING);
    console.log("Uploading images to server");
    var gt_dataURL = gtCanvas.toDataURL();
    var mask_dataURL = maskCanvas.toDataURL();
    data = {'gt': gtCanvas.toDataURL(), 'mask': maskCanvas.toDataURL()};
    PostVanisherServer("upload", data, (res) => {
        if (res.code == undefined){

        } else if (res.code == 0){
            if (res.id == undefined){

            } else if (!Number.isInteger(res.id)){

            } else {
                console.log("Waiting for result with id", res.id);
                WaitForResult(res.id);
            }
        }
    });
    //WaitForResult(102);
}
function WaitForResult(id){
    var WaitFunction = () => {
        data = {"id": id};
        PostVanisherServer("getStatus", data, (res) => {
            var finished = false;
            if (res.arraySize == undefined || !Number.isInteger(res.arraySize)){

            } else if (res.arraySize == 0 || res.array == undefined){

            } else {
                console.log(res.array);
		        for (var i = 0; i < res.array.length; i += 1000){ // 1000 to make it only process on one image
                    if (res.array[i].out_path != undefined && res.array[i].out_path.endsWith(".png")){
                        finished = true;
                        var image = new Image();
                        image.onload = () => {
                            var gtContext = gtCanvas.getContext("2d");
                            MaskEditor.ClearCanvas();
                            gtContext.clearRect(0, 0, gtCanvas.width, gtCanvas.height);
                            gtContext.drawImage(image, 0, 0, gtCanvas.width, gtCanvas.height);
                            SetPhase(IMG_CHOSEN);
                        };
                        image.src = lastDownloadableImage = IMG_PATH + "/" + res.array[0].out_path;
                    }
                }
            }
            if (!finished)
                setTimeout(WaitFunction, 1);
        });
    };
    setTimeout(WaitFunction, 1);
}

//refresh at first
Refresh();
