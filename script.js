var canvas              = document.getElementById("canvas");
var context             = canvas.getContext("2d");

var rafController       = new RAFController( update );
var inputController     = new CanvasInputController( canvas, handleInputStart, handleInputMove, handleInputEnd, true, true );
var colourPicker        = new ColourPicker( handleSetColour );

document.getElementById("colourPicker").appendChild(colourPicker.canvas);

var circles         = [];

var circlesCreated  = 0;

var gravity         = 100;     
var applyMass       = true;     
var circleFadeSpeed = 50;       
var autoColour      = true;     
var addSplatters    = true;     
var colourFadeSpeed = 0.5;      
var motionBlur      = 0.5;      
var autoColourSpeed = 0.5;      

var autoMoveCurrent  = {  x : canvas.width / 2, y : canvas.height / 2 };
var autoMoveTarget   = { x : canvas.width / 2, y : canvas.height / 2 };
var autoMoveSpeed    = 600;
var autoMove         = true;

rafController.start();
colourPicker.enable();
inputController.start();

window.addEventListener("resize", handleWindowResize);
handleWindowResize();

/*
	Circle
*/

function addCircle( x, y, colour, size, fadeSpeed )
{
	circles.push( { colour : colour, x : x, y : y, size : size, mass : Math.max(1, size * 0.1) } );
	circlesCreated++;

	if(addSplatters)
	{
		var sprayCount = Math.ceil( Math.random()*5 );
		while(sprayCount--)
		{
			var ox       = x + ( ( Math.random()*size*3 ) - ( size * 1.5 ) );
			var oy       = y + ( ( Math.random()*size*3 ) - ( size * 1.5 ) );
			var osize    = ( size * 0.1 ) + ( Math.random() * ( size * 0.5 ) );

			circles.push( { colour : colour, x : ox, y : oy, size : osize, mass : Math.max(1, osize * 0.1) } );
		}
	}

}

function circleIsActive( circle )
{
	if(  (circle.colour.r === 0 && circle.colour.g === 0 && circle.colour.b === 0) || (circle.y - circle.size > canvas.height )  ) 
	{ 
		return false; 
	}

	return true;
}

/* Loop */

function update(timestep)
{
	var timeStepSeconds = timestep / 1000;

	context.fillStyle   = "rgba(0,0,0,"+(1-motionBlur)+")";
	context.fillRect(0,0,canvas.width, canvas.height);

	if(autoColour)
	{
		colourPicker.colour = colourPicker.getSpectrumValue(circlesCreated, autoColourSpeed);
	}
    
    if(autoMove)
	{
		updateAutoMove( timeStepSeconds );
	}


	for ( var i = 0; i < circles.length; i++)
	{
		circles[i].y += applyMass ? ( gravity * timeStepSeconds ) * circles[i].mass : ( gravity * timeStepSeconds );

		circles[i].colour.r = Math.max(0, Math.round(circles[i].colour.r - ( circleFadeSpeed * timeStepSeconds ) ) );
		circles[i].colour.g = Math.max(0, Math.round(circles[i].colour.g - ( circleFadeSpeed * timeStepSeconds ) ) );
		circles[i].colour.b = Math.max(0, Math.round(circles[i].colour.b - ( circleFadeSpeed * timeStepSeconds ) ) );

		if( circleIsActive( circles[i] ) )
		{
			renderCircle( circles[i] );
		}
		else
		{
			circles.splice( i, 1);
			i--;
		}                    
	}
}

function updateAutoMove(timestep)
{
	var dx      = autoMoveTarget.x - autoMoveCurrent.x;
	var dy      = autoMoveTarget.y - autoMoveCurrent.y;
	var dist    = Math.sqrt( dx*dx + dy*dy );

	if(dist < autoMoveSpeed * timestep)
	{
		autoMoveTarget.x = Math.random()*canvas.width;
		autoMoveTarget.y = Math.random()*canvas.height;

		autoMoveSpeed = Math.random()*( 2500 - 500 ) + 500;
	}

	var angle           = Math.atan2(dy, dx);
	var currSpeed 		= ( Math.sin(circlesCreated) + 1 ) * autoMoveSpeed;
	var nextX           = autoMoveCurrent.x + ( (currSpeed * timestep) * Math.cos(angle) );
	var nextY           = autoMoveCurrent.y + ( (currSpeed * timestep) * Math.sin(angle) );

	var midX  = nextX + ( autoMoveCurrent.x - nextX ) / 2;
	var midY  = nextY + ( autoMoveCurrent.y - nextY ) / 2;

	addCircle(midX, midY,  colourPicker.getSinToWhiteValue( colourPicker.colour , colourFadeSpeed, circlesCreated ) , (currSpeed * timestep) / 2 );

	autoMoveCurrent.x = nextX;
	autoMoveCurrent.y = nextY;

}

/* Render */

function renderCircle( circle )
{
	context.save();
	context.beginPath();
	context.globalAlpha = circle.alpha;
	context.fillStyle = 'rgb('+circle.colour.r+', '+circle.colour.g+', '+circle.colour.b+')'; 
	context.arc(circle.x, circle.y, circle.size, 0, 2 * Math.PI, false);
	context.fill();
	context.restore();
}

/* Mouse */

function handleInputMove(e)
{         
	addCircle( e.midX, e.midY,  colourPicker.getSinToWhiteValue( colourPicker.colour , colourFadeSpeed, circlesCreated ) , e.distance / 2 );
}
function handleInputStart()  { autoMove = false; }
function handleInputEnd()  { autoMove = true; }

function handleSetColour()
{
	autoColour = false;
	document.getElementById('autocolourcheckbox').checked = false;
}

function handleWindowResize()
{
	canvas.width    = canvas.parentNode.clientWidth;
	canvas.height   = canvas.parentNode.clientHeight;
}

function handleSetGravity(e) { gravity = e.value; }
function handleSetMass(e) { applyMass = e.checked; }
function handleSetfadeSpeed(e) { circleFadeSpeed = e.value; }
function handleSetAutoColour(e) { autoColour = e.checked; }
function handleSetAddSplatters(e) { addSplatters = e.checked; }
function handleSetMotionBlur(e){ motionBlur = e.value; }
function handleSetAutoColourSpeed(e){ autoColourSpeed = e.value; }
function handleSetColourFadeSpeed(e) { colourFadeSpeed = e.value; }

/* Controller Animation */

function RAFController( onUpdate )
{
    var timePrev        = new Date().getTime();
    var timeStep        = 0;
    var timePaused      = 0;

    var updateCallback  = onUpdate;

    function update()
    {
        var time    = new Date().getTime();
        timeStep    = time - timePrev;
        timePrev    = time;
        if( updateCallback ){ updateCallback(timeStep); }
        window.requestAnimationFrame(update);
    }

    this.start = function()
    {
        timePrev = new Date().getTime();
        timeStep = 0;

        update();
    }

    this.pause = function()
    {
        timePaused = new date().getTime();
        window.cancelAnimationFrame(update);
    }

    this.resume = function()
    {
        timePrev = new Date().getTime() - timePaused;
        update();
    }
}

/* Canvas Controller */

function CanvasInputController( canvasElement, onInputDown, onInputMove, onInputRelease, cancelOnLeave, autoMouseMove )
{
    var canvas      = canvasElement;
    var onDown      = onInputDown;
    var onMove      = onInputMove;
    var onRelease   = onInputRelease;

    var lastInputX  = 0;
    var lastInputY  = 0;
    var inputActive = false;

    this.start = function()
    {
        if(autoMouseMove)
        {
            canvas.addEventListener("mousemove", handleMouseMove);
        }
        else
        {
            canvas.addEventListener("mousedown", handleMouseDown);
        }
            canvas.addEventListener("touchstart", handleMouseDown);
    }
    
    function handleMouseDown(e) { handleUserInput(e, handleInputStart ); }
    function handleMouseUp(e) { handleUserInput(e, handleInputEnd ); }
    function handleMouseMove(e) { handleUserInput(e, handleInputMoved ); }

    function handleUserInput( e, callback )
    {
        var x = e.clientX;
        var y = e.clientY;

        if(e.touches && e.touches.length > 0)
        {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }

        callback( x, y )
    }
    

    function handleInputStart(x, y)
    {
        lastInputX = x;
        lastInputY = y;
        inputActive = true;

        if(onDown)  
        { 
            var cdata = screenToCanvas( {x:x, y:y});
            if(isWithinCanvas(cdata)){ onDown( cdata );  }    
         }

        canvas.addEventListener("touchmove", handleMouseMove);
        canvas.addEventListener("touchend", handleMouseUp);

        if(!autoMouseMove)
        {
            canvas.addEventListener("mousemove", handleMouseMove);
            canvas.addEventListener("mouseup", handleMouseUp);
            if(cancelOnLeave){ canvas.addEventListener("mouseleave", handleMouseUp); }
        }        
        
    }

    function handleInputMoved(x, y)
    {
        if(onMove)
        {
            var input       = {};

            input.x               = x;
            input.y               = y;
            input.dx              = lastInputX - x;
            input.dy              = lastInputY - y;
            input.midpointX       = x + ( lastInputX - x ) / 2;
            input.midpointY       = y + ( lastInputY - y ) / 2;
            input.distanceMoved   =  Math.sqrt( input.dx*input.dx + input.dy*input.dy );
            
            var cdata = screenToCanvas( input );
            if(isWithinCanvas(cdata)){ onMove( cdata );  }  
        }

        if(!inputActive && onDown){ onDown(input); }
        if(autoMouseMove && cancelOnLeave)
        {
            canvas.addEventListener("mouseleave", handleMouseUp);
        } 
        

        lastInputX = x;
        lastInputY = y;
        inputActive = true;
    }

    function handleInputEnd(x, y)
    {

        if(onRelease) 
        {  
            var cdata = screenToCanvas( {x:x, y:y});
            if(cancelOnLeave || isWithinCanvas(cdata)){ onRelease( cdata );  }            
        }

  
        canvas.removeEventListener("touchmove", handleMouseMove);
        canvas.removeEventListener("touchend", handleMouseUp);

        if(!autoMouseMove)
        {
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
            if(cancelOnLeave){ canvas.removeEventListener("mouseleave", handleMouseUp); }
        }   

        lastInputX = x;
        lastInputY = y;   
        inputActive = false;    
    }


    function screenToCanvas( inputdata )
    {
        var bounds  = canvas.getBoundingClientRect();
        var scale   = canvas.clientWidth / canvas.width;

        return {

            x           : ( inputdata.x - bounds.left ) /  scale,
            y           : ( inputdata.y - bounds.top  ) / scale,
            midX        : (inputdata.midpointX - bounds.left ) / scale  || ( inputdata.x - bounds.left ) /  scale,
            midY        : (inputdata.midpointY - bounds.top) / scale    || ( inputdata.y - bounds.top  ) / scale,
            distanceX   : inputdata.dx / scale                          || 0,
            distanceY   : inputdata.dy / scale                          || 0,
            distance    : inputdata.distanceMoved / scale               || 0

        }
        
    }

    function isWithinCanvas( data )
    {
        return ( data.x > 0 && data.x < canvas.width && data.y > 0 && data.y < canvas.height );
    }
}



/* Color Picker*/


function ColourPicker(  colourSelectCallback )
{
    var onColourSelect  = colourSelectCallback;

    var activeColour        = { r: 255, g : 255, b : 255};

    var colourCanvas        = document.createElement("canvas");
    colourCanvas.width      = 300;
    colourCanvas.height     = 100;
        
    var colourContext       = colourCanvas.getContext("2d");

    var inputController     = new CanvasInputController( colourCanvas, handleUserInput, handleUserInput, handleUserInput );
   
    for (var i = 0; i < 32; ++i)
    {
        var color = getSpectrumValue(i, 0.16);

        colourContext.fillStyle = 'rgb('+color.r+','+color.g+','+color.b+')';
        colourContext.fillRect( i * ( colourCanvas.width / 32 ) - 1, 0, ( colourCanvas.width / 32 ) + 1, colourCanvas.height-30  );

        if(i === 0)  { setActiveColour(color.r,color.g,color.b); }
    }   

    function handleUserInput(e)
    {
        var pixelData = colourContext.getImageData(e.x, e.y, 1, 1).data;

        setActiveColour(pixelData[0], pixelData[1], pixelData[2]);

        if(onColourSelect){ onColourSelect(activeColour); }
    }

    
    function setActiveColour(r, g, b)
    {
        activeColour.r = r;
        activeColour.g = g;
        activeColour.b = b;
                
        colourContext.fillStyle = 'rgb('+activeColour.r+','+activeColour.g+','+activeColour.b+')';
        colourContext.fillRect(0,colourCanvas.height-20,colourCanvas.width,20);
    }

    function getSpectrumValue( position, frequency )
    {
        return  {
            r : Math.round(Math.sin(frequency*position + 0) * 127 + 128),
            g : Math.round(Math.sin(frequency*position + 2) * 127 + 128),
            b : Math.round(Math.sin(frequency*position + 4) * 127 + 128)
        }           
    } 

    this.enable = function()
    {
        inputController.start();
    }


    this.getSinToWhiteValue = function( colour, damping, step )
    {

        let sin = ( Math.sin(step * damping) + 1 ) / 2;


        return {

            r : Math.round( colour.r + ( sin * ( 255 - colour.r ) ) ),
            g : Math.round( colour.g + ( sin * ( 255 - colour.g ) ) ),
            b : Math.round( colour.b + ( sin * ( 255 - colour.b ) ) )

        }
    }

    Object.defineProperty(this, 'canvas', {  get: function() { return colourCanvas; } });
    Object.defineProperty(this, 'colour', {  get: function() { return activeColour; }, set: function(value) { setActiveColour(value.r, value.g, value.b); } });

    this.getSpectrumValue = getSpectrumValue;

}