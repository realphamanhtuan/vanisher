class MaskEditor{
    //cursor section
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

    //maskeditor section
    static InitializeMaskEditor(canvas){
        MaskEditor.canvas = canvas;
        MaskEditor.penDown = false;
        MaskEditor.drawingAllowed = false;
        MaskEditor.SetCursorSize(DEFAULT_PENCIL_SIZE);
        MaskEditor.HideCursor();

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
        console.log("maskeditor initialized");
    }
    static ClearCanvas(){
        if (MaskEditor.canvas == undefined){
            console.log("Cannot clear canvas if the canvas is null.");
        } else {
            MaskEditor.context = MaskEditor.canvas.getContext("2d");
            MaskEditor.width = MaskEditor.canvas.width;
            MaskEditor.height = MaskEditor.canvas.height;
            MaskEditor.context.clearRect(0, 0, MaskEditor.width, MaskEditor.height);
            console.log("Canvas cleared");
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

        if (MaskEditor.penDown && MaskEditor.drawingAllowed){
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
        MaskEditor.penDown = true;
    }
    static MouseUpEvent(ev){ 
        MaskEditor.penDown = false;
    }
    static UpdateDrawingState(drawingAllowed){
        MaskEditor.drawingAllowed = drawingAllowed;
    }
}