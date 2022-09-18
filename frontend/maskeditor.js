
class MaskEditor{
    static cursor;
    static cursorSize;
    static EnsureCursorExistence(){
        if (MaskEditor.cursor == undefined){
            console.log("Creating cursor HTML element");
            MaskEditor.cursor = document.createElement("div");
            MaskEditor.cursor.className = "cursor";
            document.body.appendChild(MaskEditor.cursor);
        }
    }
    static GetCursorSize(){
        MaskEditor.EnsureCursorExistence();
        if (MaskEditor.cursorSize == undefined) return DEFAULT_PENCIL_SIZE;
    }
    static SetCursorSize(size){
        MaskEditor.EnsureCursorExistence();
        MaskEditor.cursorSize = Math.max(MIN_PENCIL_SIZE, Math.min(MAX_PENCIL_SIZE, size));
        console.log("Setting cursor size to", MaskEditor.cursorSize);
        MaskEditor.cursor.style.width = MaskEditor.cursor.style.height = MaskEditor.cursorSize + "px";
    }
    static ShowCursor(){
        MaskEditor.EnsureCursorExistence();
        MaskEditor.cursor.style.display = "block";
    }
    static HideCursor(){
        MaskEditor.EnsureCursorExistence();
        MaskEditor.cursor.style.display = "none";
    }
    static InitializeBlankCanvas(canvas){
        MaskEditor.canvas = canvas;
        MaskEditor.drawing = false;
        if (MaskEditor.canvas == undefined){
            console.log("Cannot initialize mask editor if the canvas is null.");
        } else {
            MaskEditor.context = MaskEditor.canvas.getContext("2d");
            MaskEditor.width = MaskEditor.canvas.width;
            MaskEditor.height = MaskEditor.canvas.height;
            MaskEditor.context.clearRect(0, 0, MaskEditor.width, MaskEditor.height);
            MaskEditor.SetCursorSize(MaskEditor.GetCursorSize());

            //set event listeners
            MaskEditor.canvas.removeEventListener("mouseover", MaskEditor.MouseOverEvent);
            MaskEditor.canvas.removeEventListener("mouseout", MaskEditor.MouseOutEvent);
            MaskEditor.canvas.removeEventListener("mousemove", MaskEditor.MouseMoveEvent);
            document.removeEventListener("mousedown", MaskEditor.MouseDownEvent);
            document.removeEventListener("mouseup", MaskEditor.MouseUpEvent);
            
            MaskEditor.canvas.addEventListener("mouseover", MaskEditor.MouseOverEvent);
            MaskEditor.canvas.addEventListener("mouseout", MaskEditor.MouseOutEvent);
            MaskEditor.canvas.addEventListener("mousemove", MaskEditor.MouseMoveEvent);
            document.addEventListener("mousedown", MaskEditor.MouseDownEvent);
            document.addEventListener("mouseup", MaskEditor.MouseUpEvent);
            console.log("Blank canvas initialized");
        }
    }

    //event listeners
    static MouseOverEvent(ev){
        MaskEditor.ShowCursor();
    }
    static MouseMoveEvent(ev){
        MaskEditor.cursor.style.left = ev.pageX + "px";
        MaskEditor.cursor.style.top = ev.pageY + "px";
        //console.log("Updating mouse position", ev.pageX, ev.pageY);

        if (MaskEditor.drawing){
            //console.log("Drawing circle with size", MaskEditor.cursorSize, "at (" + ev.offsetX + ", " + ev.offsetY + ")");
            MaskEditor.context.fillStyle = "#ffffff";
            MaskEditor.context.beginPath();
            MaskEditor.context.arc(ev.offsetX, ev.offsetY, MaskEditor.cursorSize / 2, 0, 2 * Math.PI);
            MaskEditor.context.fill();
        }
    }
    static MouseOutEvent(ev){
        MaskEditor.HideCursor();
    }
    static MouseDownEvent(ev){
        MaskEditor.drawing = true;
    }
    static MouseUpEvent(ev){ 
        MaskEditor.drawing = false;
    }
    
    
}