function setupResponsiveCanvas(canvas:HTMLCanvasElement,width:number,height:number)
{  
    const dpr = window.devicePixelRatio ||1;
    canvas.width = width*dpr;
    canvas.height = height*dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if(ctx)
    {
        ctx.scale(dpr,dpr)
    }
}


export {setupResponsiveCanvas }