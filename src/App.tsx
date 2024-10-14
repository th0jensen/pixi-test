import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixijs';

const COLORS = [
    0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A, 0x98D8C8,
    0xF67280, 0xC06C84, 0x6C5B7B, 0x355C7D, 0xF8B195
];

interface Recipe {
    name: string;
}

interface TivoliWheelProps {
    recipes: Recipe[];
}

const TivoliWheel: React.FC<TivoliWheelProps> = ({ recipes }) => {
    const wheelRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const wheelContainerRef = useRef<PIXI.Container | null>(null);
    const tickerRef = useRef<PIXI.Graphics | null>(null);
    const [winningItem, setWinningItem] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    const createWheel = useCallback(() => {
        if (!appRef.current || recipes.length < 2 || recipes.length > 100) return;

        if (wheelContainerRef.current) {
            appRef.current.stage.removeChild(wheelContainerRef.current);
        }

        const wheel = new PIXI.Container();
        wheelContainerRef.current = wheel;
        appRef.current.stage.addChild(wheel);

        const radius = 200;
        const centerX = 250;
        const centerY = 250;

        recipes.forEach((recipe, index) => {
            const slice = new PIXI.Graphics();
            const startAngle = (index / recipes.length) * Math.PI * 2;
            const endAngle = ((index + 1) / recipes.length) * Math.PI * 2;

            slice.beginFill(COLORS[index % COLORS.length]);
            slice.moveTo(0, 0);
            slice.arc(0, 0, radius, startAngle, endAngle);
            slice.lineTo(0, 0);
            slice.endFill();

            const text = new PIXI.Text(recipe.name, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xffffff,
                align: 'center',
            });
            text.anchor.set(0.5);
            text.position.set(
                Math.cos((startAngle + endAngle) / 2) * (radius / 2),
                Math.sin((startAngle + endAngle) / 2) * (radius / 2)
            );

            const sliceContainer = new PIXI.Container();
            sliceContainer.addChild(slice);
            sliceContainer.addChild(text);
            wheel.addChild(sliceContainer);
        });

        wheel.position.set(centerX, centerY);

        const ticker = new PIXI.Graphics();
        ticker.beginFill(0x000000);
        ticker.drawPolygon([10, 20, 20, 0, 0, 0]);
        ticker.endFill();
        ticker.position.set(centerX, centerY - radius - 10);
        appRef.current.stage.addChild(ticker);
        tickerRef.current = ticker;

    }, [recipes]);

    useEffect(() => {
        if (!wheelRef.current || appRef.current) return;

        appRef.current = new PIXI.Application({
            width: 500,
            height: 500,
            backgroundAlpha: 0,
        });

        wheelRef.current.appendChild(appRef.current.view as HTMLCanvasElement);

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true);
                appRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        createWheel();
    }, [createWheel]);

    const getWinningItem = useCallback((finalRotation: number) => {
        if (recipes.length === 0) return null;

        // Normalize the rotation to be between 0 and 2π
        const normalizedRotation = (finalRotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

        // Calculate the angle of each slice
        const sliceAngle = (Math.PI * 2) / recipes.length;

        // The winning index is the one at the top (3π/2 position)
        const topPosition = 3 * Math.PI / 2;

        // Calculate how many slices away from the top position we are
        const slicesFromTop = Math.floor(((topPosition - normalizedRotation + Math.PI * 2) % (Math.PI * 2)) / sliceAngle);

        // The winning index is the number of slices from the top
        const winningIndex = slicesFromTop % recipes.length;

        return recipes[winningIndex].name;
    }, [recipes]);

    const spin = useCallback(() => {
        if (!wheelContainerRef.current || !tickerRef.current || recipes.length === 0 || isSpinning) return;

        setIsSpinning(true);
        setWinningItem(null);

        const wheel = wheelContainerRef.current;
        const spinDuration = 10000; // 10 seconds
        const maxRotations = 10 + Math.random(); // Random number of full rotations plus a partial rotation
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / spinDuration, 1);

            // Easing function for deceleration
            const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

            const rotation = maxRotations * Math.PI * 2 * easeOut(progress);
            wheel.rotation = rotation;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                const winner = getWinningItem(rotation);
                setWinningItem(winner);
                setIsSpinning(false);
            }
        };

        animate();
    }, [recipes, isSpinning, getWinningItem]);

    return (
        <div>
            <div ref={wheelRef}></div>
            <button onClick={spin} disabled={isSpinning || recipes.length === 0}>
                {isSpinning ? 'Spinning...' : 'Spin'}
            </button>
            {winningItem && <p>Winning item: {winningItem}</p>}
        </div>
    );
};


export default function WheelPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([
        { name: 'Pizza' },
        { name: 'Pasta' },
        { name: 'Salad' },
        { name: 'Soup' },
        { name: 'Steak' },
    ]);

    const randomizeRecipes = () => {
        const shuffled = [...recipes].sort(() => Math.random() - 0.5);
        setRecipes(shuffled);
    };

    return (
        <div>
            <h1>Tivoli Wheel</h1>
            <TivoliWheel recipes={recipes} />
            <button onClick={randomizeRecipes}>Randomize</button>
        </div>
    );
}
