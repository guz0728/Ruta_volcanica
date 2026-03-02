/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';

type GameState = 'START' | 'INTRO' | 'PLAYING' | 'GAME_OVER';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [gameId, setGameId] = useState(0);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  const [score, setScore] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [finalLives, setFinalLives] = useState(0);
  const [finalFuel, setFinalFuel] = useState(0);

  return (
    <div className="min-h-screen bg-black text-orange-500 font-mono flex flex-col items-center justify-center overflow-hidden relative">
      <button 
        onClick={toggleFullScreen} 
        className="absolute top-4 right-4 z-50 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full border-2 border-gray-700 shadow-lg transition-colors"
        title="Pantalla Completa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
      </button>

      {gameState === 'START' && (
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-600 mb-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">RUTA VOLCÁNICA</h1>
          <p className="text-xl mb-8 text-orange-400">Escapa de la erupción</p>
          <div className="mb-8 text-left inline-block bg-gray-900 p-6 rounded border border-red-800">
            <h2 className="text-2xl mb-4 text-red-500">Controles:</h2>
            <ul className="text-lg">
              <li><span className="font-bold text-white">W</span>: Acelerar</li>
              <li><span className="font-bold text-white">S</span>: Frenar</li>
              <li><span className="font-bold text-white">A</span>: Izquierda</li>
              <li><span className="font-bold text-white">D</span>: Derecha</li>
            </ul>
          </div>
          <br />
          <button 
            className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white text-2xl font-bold rounded border-4 border-red-900 transition-colors cursor-pointer"
            onClick={() => setGameState('INTRO')}
          >
            INICIAR ESCAPE
          </button>
        </div>
      )}

      {gameState === 'INTRO' && (
        <div className="text-center max-w-2xl bg-gray-900 p-8 rounded-xl border-2 border-orange-500 shadow-[0_0_30px_rgba(255,100,0,0.5)] z-10 relative mx-4">
          <h2 className="text-4xl font-bold text-orange-500 mb-6">LA HISTORIA</h2>
          <p className="text-xl text-white mb-4 leading-relaxed">
            El Monte Ígneo ha despertado tras siglos de letargo. La lava devora la ciudad y la única salida es la <span className="text-red-500 font-bold">Ruta Volcánica</span>.
          </p>
          <p className="text-xl text-white mb-8 leading-relaxed">
            Tienes <span className="text-green-400 font-bold">500 metros</span> para alcanzar la zona segura antes de que la carretera colapse por completo. El combustible escasea y los peligros abundan. ¡Acelera y no mires atrás!
          </p>
          <button 
            className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white text-2xl font-bold rounded border-4 border-orange-800 transition-colors cursor-pointer"
            onClick={() => {
              setGameId(prev => prev + 1);
              setGameState('PLAYING');
            }}
          >
            ARRANCAR MOTOR
          </button>
        </div>
      )}

      {(gameState === 'PLAYING' || gameState === 'GAME_OVER') && (
        <div className="relative">
          <GameCanvas 
            key={gameId}
            isFrozen={gameState === 'GAME_OVER'}
            onGameOver={(finalScore, win, lives, fuel) => {
              setScore(finalScore);
              setIsWin(win);
              setFinalLives(lives);
              setFinalFuel(fuel);
              setGameState('GAME_OVER');
            }} 
          />

          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 rounded-lg">
              <div className="text-center max-w-md w-full bg-gray-900 p-8 rounded-xl border-2 border-red-800 shadow-[0_0_30px_rgba(255,0,0,0.5)] mx-4">
                <h1 className={`text-5xl font-bold mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] ${isWin ? 'text-green-500' : 'text-red-600'}`}>
                  {isWin ? '¡HAS ESCAPADO!' : 'GAME OVER'}
                </h1>
                
                <div className="bg-black border border-gray-700 rounded p-4 mb-8 text-left">
                  <h3 className="text-xl text-orange-500 font-bold mb-4 text-center border-b border-gray-700 pb-2">ESTADÍSTICAS</h3>
                  <table className="w-full text-lg">
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 text-gray-400">Distancia</td>
                        <td className="py-3 text-right font-bold text-white">{Math.floor(score)} / 500 m</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 text-gray-400">Vidas restantes</td>
                        <td className="py-3 text-right font-bold text-red-500">{finalLives}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-400">Combustible</td>
                        <td className="py-3 text-right font-bold text-green-400">{Math.floor(finalFuel)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button 
                  className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white text-2xl font-bold rounded border-4 border-red-900 transition-colors cursor-pointer w-full"
                  onClick={() => {
                    setGameState('START');
                    setScore(0);
                  }}
                >
                  FINALIZAR JUEGO
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
