import { useEffect, useRef } from 'react';

interface MeshGradientProps {
    className?: string;
}

const MeshGradient = ({ className = '' }: MeshGradientProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration
        const MESH_COLS = 30;
        const MESH_ROWS = 20;
        const INFLUENCE_RADIUS = 300;
        const MAX_DISPLACEMENT = 50;
        const EASING_FACTOR = 0.05;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();

        // Generate grid points
        const points: Array<{ x: number; y: number; baseX: number; baseY: number }> = [];
        const cols = MESH_COLS + 1;
        const rows = MESH_ROWS + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = (col / MESH_COLS) * canvas.width;
                const y = (row / MESH_ROWS) * canvas.height;
                points.push({ x, y, baseX: x, baseY: y });
            }
        }

        // Mouse tracking
        const handleMouseMove = (e: MouseEvent) => {
            targetRef.current = { x: e.clientX, y: e.clientY };
        };

        // Animation loop
        const animate = () => {
            // Smooth mouse following
            mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * EASING_FACTOR;
            mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * EASING_FACTOR;

            const mouseX = mouseRef.current.x;
            const mouseY = mouseRef.current.y;

            // Clear canvas
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update point positions based on mouse
            points.forEach((point) => {
                const dx = mouseX - point.baseX;
                const dy = mouseY - point.baseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < INFLUENCE_RADIUS) {
                    const influence = 1 - distance / INFLUENCE_RADIUS;
                    const displacement = influence * MAX_DISPLACEMENT;

                    point.x = point.baseX + (dx / distance) * displacement;
                    point.y = point.baseY + (dy / distance) * displacement;
                } else {
                    point.x = point.baseX;
                    point.y = point.baseY;
                }
            });

            // Draw mesh
            for (let row = 0; row < MESH_ROWS; row++) {
                for (let col = 0; col < MESH_COLS; col++) {
                    const idx = row * cols + col;
                    const p1 = points[idx];
                    const p2 = points[idx + 1];
                    const p3 = points[idx + cols + 1];
                    const p4 = points[idx + cols];

                    // Calculate color based on distance from mouse
                    const centerX = (p1.x + p2.x + p3.x + p4.x) / 4;
                    const centerY = (p1.y + p2.y + p3.y + p4.y) / 4;
                    const dx = mouseX - centerX;
                    const dy = mouseY - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxDistance = 400;
                    const colorIntensity = Math.max(0, 1 - distance / maxDistance);

                    // RGB calculation (purple → blue → cyan)
                    const r = 100 + colorIntensity * 100;
                    const g = 50 + colorIntensity * 150;
                    const b = 200 + colorIntensity * 55;
                    const alpha = 0.15 + colorIntensity * 0.25;

                    // Fill quad
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.lineTo(p4.x, p4.y);
                    ctx.closePath();
                    ctx.fill();

                    // Draw grid lines
                    const lineWidth = 0.5 + colorIntensity * 1.5;
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                }
            }

            // Radial gradient overlay at mouse position
            const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 300);
            gradient.addColorStop(0, 'rgba(150, 100, 255, 0.2)');
            gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', resizeCanvas);
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 ${className}`}
            style={{ zIndex: 0 }}
        />
    );
};

export default MeshGradient;
