import React, { useEffect,useRef, useState } from "react";
import {SWATCHES} from '@/constants'; 
import { ColorSwatch, Group } from "@mantine/core"; 
import {Button} from '@/components/ui/button'; 
import Draggable from 'react-draggable'; 
import axios from 'axios'; 

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface GeneratedResult {
    expression: string;
    answer: string;
}

export default function Home(){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false); 
    const [result, setResult] = useState<GeneratedResult>();
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 }); 
    const [dictOfVars, setDictOfVars] = useState({}); 
    const [isEraserActive, setIsEraserActive] = useState(false); // Eraser state
 
    useEffect(() => {
        if (reset){
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false); 
        }
    }, [reset]); 


    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) { 
            setTimeout(() => {
                    window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0); 
        }
    }, [latexExpression]);


    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer); 
        }
    }, [result]);


    useEffect(() => {
        const canvas = canvasRef.current; 

        if (canvas){
            const ctx = canvas.getContext('2d'); 
            if (ctx){
                canvas.width = window.innerWidth; 
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js';
        script.async = true; 
        document.head.appendChild(script); 

        script.onload = () => {
            console.log('MathJax has been loaded');
            window.MathJax.Hub.Config({ 
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]}, 
            });
        };

        return () => {
            document.head.removeChild(script); 
        };
    }, []); 


    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;

        setLatexExpression([...latexExpression, latex]);

        if (window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]); 
            }, 0);
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d'); 
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };


    const sendData = async () => {
        const canvas = canvasRef.current; 

        if (canvas){
            const response = await axios({ 
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`, 
                data: {
                    image: canvas.toDataURL('image/png'), 
                    dict_of_vars: dictOfVars, 
                }
            })
            const resp = await response.data; 
            resp.data.forEach((data: Response) => { 
                if (data.assign === true) { 
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result 
                    });
                }
            });


            const ctx = canvas.getContext('2d');
            const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height); 
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0; 

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    if (imageData.data[(y * canvas.width + x) * 4 + 3] > 0) { 
                        minX = Math.min(minX, x); 
                        minY = Math.min(minY, y); 
                        maxX = Math.max(maxX, x); 
                        maxY = Math.max(maxY, y); 
                    }
                }
            }
            const centerX = (minX + maxX) / 2; 
            const centerY = (minY + maxY) / 2; 

            setLatexPosition({ x: centerX, y: centerY }); 
                resp.data.forEach((data: Response) => { 
                    setTimeout(() => {
                        setResult({ 
                            expression: data.expr,
                            answer: data.result
                        });
                    }); 
            }, 200);
        }   
    };

    
    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                console.log('Clearing canvas'); 
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; 
        if (canvas) {
            canvas.style.background = 'black'; 
            const ctx = canvas.getContext('2d'); 
            if (ctx) {
                ctx.beginPath(); 
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); 
                setIsDrawing(true); 
            }
        }
    };   

    // Function to stop drawing on the canvas
    const stopDrawing = () => {
        setIsDrawing(false); // Set drawing state to false
    };

    // Function to draw on the canvas
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) { // If not currently drawing, exit the function
            return;
        }

        const canvas = canvasRef.current; // Get the canvas reference
        if (canvas) {
            const ctx = canvas.getContext('2d'); // Get the 2D context
            if (ctx) {
                if (isEraserActive) {
                    // Erasing logic
                    ctx.clearRect(e.nativeEvent.offsetX - 3, e.nativeEvent.offsetY - 3, 6, 6); // Adjust size of eraser area
                } else{
                    ctx.strokeStyle = color; // Set the drawing color
                    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); // Draw a line to the current mouse position
                    ctx.stroke(); // Apply the stroke
                }
            }
        }
    };

    // Render method to return the UI components
    return (
        <>
            <div className='grid grid-cols-4 gap-0 m-1 p-0'> {/* Grid layout for buttons */}
                <Button
                    onClick={() => { 
                        console.log('Reset button clicked'); // Log the reset action
                        setReset(true); // Trigger canvas reset
                    }}
                    className='z-20 bg-black text-white m-0 p-0' // Button styling
                    variant='default' 
                    color='black'
                >
                    Reset {/* Button text */}
                </Button>
                <Button
                    onClick={() => setIsEraserActive(!isEraserActive)} // Toggle eraser mode
                    className='z-20 bg-red-500 text-white h-8 px-2 text-xs w-full'
                    variant='default'
                    color='red'
                >
                    {isEraserActive ? 'Stop Erasing' : 'Eraser'}
                </Button>
                
                <Group className='z-20 flex gap-0 m-0 p-0'> {/* Grouping color swatches */}
                    {SWATCHES.map((swatchColor: string) => ( // Map over available swatches
                        <ColorSwatch 
                            key={swatchColor} // Unique key for each swatch
                            color={swatchColor} // Swatch color
                            onClick={() => setColor(swatchColor)} // Set color on click
                        />
                    ))}
                </Group>
                <Button
                    onClick={sendData} // Call sendData on click
                    className='z-20 bg-black text-white m-0 p-0' // Button styling
                    variant='default'
                    color='black'
                >
                    Run {/* Button text */}
                </Button>
                
            </div>
            <canvas 
                ref={canvasRef} // Reference to the canvas element
                id='canvas' // Canvas ID for styling
                className='absolute top-0 left-0 w-full h-full' // Full-screen canvas styling
                onMouseDown={startDrawing} // Start drawing on mouse down
                onMouseOut={stopDrawing} // Stop drawing on mouse out
                onMouseUp={stopDrawing} // Stop drawing on mouse up
                onMouseMove={draw} // Draw on mouse move
            />
            {latexExpression && latexExpression.map((latex, index) => ( // Render LaTeX expressions if available
                <Draggable
                    key={index} // Unique key for each LaTeX expression
                    defaultPosition={latexPosition} // Initial position for draggable component
                    onStop={(data) => setLatexPosition({ x: data.x, y: data.y })} // Update position on drag stop
                >
                    <div className='absolute text-white'> {/* LaTeX content styling */}
                        <div className="latex-content">{latex}</div> {/* Render LaTeX as text */}
                    </div>
                </Draggable>
            ))}
        </>
    );
}
