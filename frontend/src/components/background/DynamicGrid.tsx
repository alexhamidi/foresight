"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
export default function DynamicGrid() {
  // const svgRef = useRef<SVGSVGElement>(null);
  // const nodesRef = useRef<
  //   Array<{
  //     element: SVGCircleElement | null;
  //     baseX: number;
  //     baseY: number;
  //     currentX: number;
  //     currentY: number;
  //   }>
  // >([]);
  // const linesRef = useRef<
  //   Array<{
  //     element: SVGLineElement | null;
  //     nodeA: number;
  //     nodeB: number;
  //   }>
  // >([]);
  // const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // const mousePositionRef = useRef({ x: 0, y: 0 });
  // const animationFrameRef = useRef<number>();

  // // Grid settings
  // const gridSpacing = 50; // Increased spacing for fewer nodes
  // const nodeRadius = 1;
  // const lineWidth = 0.5;
  // const maxDistance = 80; // Slightly reduced for fewer connections
  // const distortionFactor = 100;
  // const easingFactor = 0.1;
  // const opacitySetting = 50; // Base opacity setting (100 = current opacity)
  // const baseNodeOpacity = 0.5 * (opacitySetting / 100);

  // // Initialize dimensions and mouse position
  // useEffect(() => {
  //   const updateDimensions = () => {
  //     const width = window.innerWidth;
  //     const height = window.innerHeight;

  //     setDimensions({ width, height });
  //     mousePositionRef.current = { x: width / 2, y: height / 2 };

  //     // Clear previous grid when dimensions change
  //     if (svgRef.current) {
  //       while (svgRef.current.firstChild) {
  //         svgRef.current.removeChild(svgRef.current.firstChild);
  //       }

  //       nodesRef.current = [];
  //       linesRef.current = [];
  //     }
  //   };

  //   updateDimensions();
  //   window.addEventListener("resize", updateDimensions);

  //   return () => {
  //     window.removeEventListener("resize", updateDimensions);
  //   };
  // }, []);

  // // Create grid nodes and lines when dimensions change
  // useEffect(() => {
  //   if (dimensions.width === 0 || dimensions.height === 0 || !svgRef.current)
  //     return;

  //   // Create nodes and add them to the DOM once
  //   const cols = Math.ceil(dimensions.width / gridSpacing) + 1;
  //   const rows = Math.ceil(dimensions.height / gridSpacing) + 1;

  //   // Create nodes first
  //   for (let i = 0; i < cols; i++) {
  //     for (let j = 0; j < rows; j++) {
  //       const circle = document.createElementNS(
  //         "http://www.w3.org/2000/svg",
  //         "circle",
  //       );
  //       const x = i * gridSpacing;
  //       const y = j * gridSpacing;

  //       circle.setAttribute("cx", x.toString());
  //       circle.setAttribute("cy", y.toString());
  //       circle.setAttribute("r", nodeRadius.toString());
  //       circle.setAttribute("fill", `rgba(0, 0, 0, ${baseNodeOpacity})`);
  //       circle.setAttribute("vector-effect", "non-scaling-stroke");

  //       svgRef.current.appendChild(circle);

  //       nodesRef.current.push({
  //         element: circle,
  //         baseX: x,
  //         baseY: y,
  //         currentX: x,
  //         currentY: y,
  //       });
  //     }
  //   }

  //   // Create potential line connections using a spatial grid for efficiency
  //   const gridCells: Record<string, number[]> = {};

  //   // Place nodes in grid cells
  //   nodesRef.current.forEach((node, index) => {
  //     const cellX = Math.floor(node.baseX / maxDistance);
  //     const cellY = Math.floor(node.baseY / maxDistance);
  //     const cellKey = `${cellX},${cellY}`;

  //     if (!gridCells[cellKey]) {
  //       gridCells[cellKey] = [];
  //     }

  //     gridCells[cellKey].push(index);
  //   });

  //   // Create lines only between nodes in nearby cells
  //   for (let i = 0; i < nodesRef.current.length; i++) {
  //     const nodeA = nodesRef.current[i];
  //     const cellX = Math.floor(nodeA.baseX / maxDistance);
  //     const cellY = Math.floor(nodeA.baseY / maxDistance);

  //     // Check nearby cells
  //     for (let dx = -1; dx <= 1; dx++) {
  //       for (let dy = -1; dy <= 1; dy++) {
  //         const cellKey = `${cellX + dx},${cellY + dy}`;
  //         const cellNodes = gridCells[cellKey];

  //         if (!cellNodes) continue;

  //         for (const j of cellNodes) {
  //           if (i >= j) continue; // Avoid duplicates

  //           const nodeB = nodesRef.current[j];
  //           const dx = nodeA.baseX - nodeB.baseX;
  //           const dy = nodeA.baseY - nodeB.baseY;
  //           const distance = Math.sqrt(dx * dx + dy * dy);

  //           if (distance < maxDistance) {
  //             const line = document.createElementNS(
  //               "http://www.w3.org/2000/svg",
  //               "line",
  //             );
  //             line.setAttribute("x1", nodeA.currentX.toString());
  //             line.setAttribute("y1", nodeA.currentY.toString());
  //             line.setAttribute("x2", nodeB.currentX.toString());
  //             line.setAttribute("y2", nodeB.currentY.toString());
  //             line.setAttribute("stroke", "rgba(0, 0, 0, 0)");
  //             line.setAttribute("stroke-width", lineWidth.toString());
  //             line.setAttribute("vector-effect", "non-scaling-stroke");

  //             svgRef.current.appendChild(line);

  //             linesRef.current.push({
  //               element: line,
  //               nodeA: i,
  //               nodeB: j,
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }

  //   // Start animation
  //   startAnimation();

  //   return () => {
  //     if (animationFrameRef.current) {
  //       cancelAnimationFrame(animationFrameRef.current);
  //     }
  //   };
  // }, [dimensions]);

  // // Handle mouse movement
  // useEffect(() => {
  //   const handleMouseMove = (e: MouseEvent) => {
  //     mousePositionRef.current = {
  //       x: e.clientX,
  //       y: e.clientY,
  //     };
  //   };

  //   window.addEventListener("mousemove", handleMouseMove);
  //   return () => {
  //     window.removeEventListener("mousemove", handleMouseMove);
  //   };
  // }, []);

  // // Animation function
  // const animate = () => {
  //   // Update node positions based on mouse position
  //   for (const node of nodesRef.current) {
  //     if (!node.element) continue;

  //     // Calculate distance from mouse
  //     const dx = mousePositionRef.current.x - node.baseX;
  //     const dy = mousePositionRef.current.y - node.baseY;
  //     const distance = Math.sqrt(dx * dx + dy * dy);

  //     // Calculate displacement
  //     const force = Math.max(0, 1 - distance / distortionFactor);

  //     // Apply displacement with easing
  //     const targetX =
  //       distance === 0 ? node.baseX : node.baseX - (dx / distance) * force * 20;

  //     const targetY =
  //       distance === 0 ? node.baseY : node.baseY - (dy / distance) * force * 20;

  //     // Apply easing to node movement
  //     node.currentX += (targetX - node.currentX) * easingFactor;
  //     node.currentY += (targetY - node.currentY) * easingFactor;

  //     // Update node position in DOM directly
  //     node.element.setAttribute("cx", node.currentX.toString());
  //     node.element.setAttribute("cy", node.currentY.toString());
  //   }

  //   // Update line connections
  //   for (const line of linesRef.current) {
  //     if (!line.element) continue;

  //     const nodeA = nodesRef.current[line.nodeA];
  //     const nodeB = nodesRef.current[line.nodeB];

  //     const dx = nodeA.currentX - nodeB.currentX;
  //     const dy = nodeA.currentY - nodeB.currentY;
  //     const distance = Math.sqrt(dx * dx + dy * dy);

  //     if (distance < maxDistance) {
  //       // Fade line based on distance
  //       const opacity = 1 - distance / maxDistance;

  //       line.element.setAttribute("x1", nodeA.currentX.toString());
  //       line.element.setAttribute("y1", nodeA.currentY.toString());
  //       line.element.setAttribute("x2", nodeB.currentX.toString());
  //       line.element.setAttribute("y2", nodeB.currentY.toString());
  //       line.element.setAttribute(
  //         "stroke",
  //         `rgba(0, 0, 0, ${opacity * 0.2 * (opacitySetting / 100)})`,
  //       );
  //     } else {
  //       line.element.setAttribute("stroke", "rgba(0, 0, 0, 0)");
  //     }
  //   }

  //   animationFrameRef.current = requestAnimationFrame(animate);
  // };

  // const startAnimation = () => {
  //   if (animationFrameRef.current) {
  //     cancelAnimationFrame(animationFrameRef.current);
  //   }
  //   animationFrameRef.current = requestAnimationFrame(animate);
  // };

  // return (
  //   <svg
  //     ref={svgRef}
  //     width="100%"
  //     height="100%"
  //     className="absolute inset-0 w-full h-full"
  //     style={{ zIndex: -1 }}
  //     viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
  //     preserveAspectRatio="xMidYMid meet"
  //   />
  // );
  return (
    <>
      <Image
        src="/beau.png"
        alt="grid"
        width={1440}
        height={900}
        className="opacity-100"
      />
    </>
  );
}
