import './App.css';
import { Canvas } from './components /canvas';
import { ColorPicker } from './components /colorPicker';
import { useState } from 'react';

export default function App() {
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  return (
    <div className='gradient-bg h-[100vh]'>
      <div className="flex flex-col w-1/2 m-auto h-[70vh] inset-shadow-md rounded-sm gap-y-2 pt-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-700">Doodle Dash</h1>
        <Canvas color={color} brushSize={brushSize} />
        <div className="bg-white self-center">
          <ColorPicker activeColor={color} setActiveColor={setColor} />
        </div>
      </div>
    </div>
  );
}
