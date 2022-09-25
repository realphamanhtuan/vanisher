const IMG_EMPTY = 0, IMG_CHOSEN = 1, IMG_UPLOADING = 2, IMAGE_COMPLETE = 3;
var phase = IMG_EMPTY;
//global variables
var gtCanvas, maskCanvas;
var imagefile, leftButton, rightButton;

//initialization
console.log("Initializing Vanisher");
imagefile = document.getElementById("imagefile");
leftButton = document.getElementById("leftButton");
rightButton = document.getElementById("rightButton");
gtCanvas = document.getElementById("gtCanvas")
maskCanvas = document.getElementById("maskCanvas");

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
            phase = IMG_CHOSEN;
            Refresh();
        } else {
            MsgBox("No image or an invalid one has been chosen. Try again.");
        }
    }
});
leftButton.addEventListener("click", LeftButtonClick);
rightButton.addEventListener("click", RightButtonClick);

//control section
function ShowChooseImageDialog(){
    imagefile.click();    
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
}
function Refresh(){
    if (phase == IMG_CHOSEN){
        MaskEditor.UpdateDrawingState(true);
    } else {
        MaskEditor.UpdateDrawingState(false);
    }
}

//refreshments
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
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
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
    phase = IMG_UPLOADING;
    console.log("Uploading images to server");
    data = {'gt': gtCanvas.toDataURL(), 'mask': maskCanvas.toDataURL()};
    /*PostVanisherServer("upload", data, (res) => {
        if (res.code == undefined){

        } else if (res.code == 0){
            if (res.id == undefined){

            } else if (!Number.isInteger(res.id)){

            } else {
                console.log("Waiting for result with id", res.id);
                WaitForResult(res.id);
            }
        }
    });*/
    WaitForResult(102);
}
function WaitForResult(id){
    var WaitFunction = () => {
        data = {"id": id};
        PostVanisherServer("getStatus", data, (res) => {
            var finished = false;
            if (res.arraySize == undefined || !Number.isInteger(res.arraySize)){

            } else if (res.arraySize == 0 || res.array == undefined){

            } else {
                finished = true;
                for (var i = 0; i < res.array.length; i += 1){
                    MaskEditor.ClearCanvas();
                    var image = new Image();
                    image.onload = () => {
                        var gtContext = gtCanvas.getContext("2d");
                        gtContext.clearRect(0, 0, gtCanvas.width, gtCanvas.height);
                        gtContext.drawImage(image, 0, 0, gtCanvas.width, gtCanvas.height);
                    };
                    image.src = IMG_PATH + "/" + res.array[0].out_path;
                }
            }
            if (!finished)
                setTimeout(WaitFunction, 1);
            else phase = IMAGE_COMPLETE;
        });
    };
    setTimeout(WaitFunction, 1);
}