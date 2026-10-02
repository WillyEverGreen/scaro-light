"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap, Database, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"orbital">("orbital");
  const [targetRotation, setTargetRotation] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ... (previous state declarations remain the same)

  // Combined animation loop for both auto-rotation and smooth targeting
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      if (lastTime !== 0) {
        setRotationAngle((currentAngle) => {
          let newAngle = currentAngle;

          if (autoRotate && viewMode === "orbital") {
            // Auto-rotation: steady increment
            newAngle = (currentAngle + 0.1) % 360;
            setTargetRotation(newAngle); // Keep target synced so no jump when auto stops
          } else {
            // Damping to target: smooth spring-like approach
            // Handle 360 wraparound for shortest path
            let dist = targetRotation - currentAngle;
            // Normalizing distance to -180 to 180 for shortest direction
            while (dist > 180) dist -= 360;
            while (dist < -180) dist += 360;

            if (Math.abs(dist) > 0.1) {
              newAngle = currentAngle + dist * 0.1; // Damping factor 0.1
            } else {
              newAngle = targetRotation; // Snap when close
            }
          }

          // Normalize 0-360
          return ((newAngle % 360) + 360) % 360;
        });
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [autoRotate, viewMode, targetRotation]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const itemAngle = (nodeIndex / totalNodes) * 360;

    // We want the item to be at 270 degrees (top)
    // current_pos = itemAngle + rotation
    // 270 = itemAngle + targetRotation
    // targetRotation = 270 - itemAngle

    setTargetRotation(270 - itemAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 224; // Exact match to w-[28rem] (448px diameter / 2)
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    // Flattened orbit: Constant zIndex and opacity
    const zIndex = 100;
    const opacity = 1;

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-green-600 border-green-400";
      case "in-progress":
        return "text-white bg-blue-600 border-blue-400";
      case "pending":
        return "text-white bg-gray-600 border-gray-400";
      default:
        return "text-white bg-gray-600 border-gray-400";
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  return (
    <div
      className="w-full h-[600px] flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-muted/30 overflow-hidden rounded-lg"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center will-change-transform backface-hidden"
          ref={orbitRef}
          style={{
            transform: `translate3d(${centerOffset.x}px, ${centerOffset.y}px, 0)`,
            transition: "transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          <div className="absolute w-20 h-20 rounded-full bg-white border-2 border-primary/20 shadow-lg flex items-center justify-center z-10">
            <Target size={24} className="text-primary" />
          </div>

          <div className="absolute w-[28rem] h-[28rem] rounded-full border border-primary/20"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute cursor-pointer will-change-transform will-change-opacity backface-hidden transition-all duration-1000 ease-out"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, rgba(var(--primary), 0.2) 0%, rgba(var(--primary), 0) 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    isExpanded
                      ? "bg-primary text-primary-foreground"
                      : isRelated
                        ? "bg-primary/50 text-primary-foreground"
                        : "bg-background text-foreground"
                  }
                  border-2 
                  ${
                    isExpanded
                      ? "border-primary shadow-lg shadow-primary/30"
                      : isRelated
                        ? "border-primary animate-pulse"
                        : "border-border"
                  }
                  transition-all duration-700 ease-out transform will-change-transform backface-hidden
                  ${isExpanded ? "scale-150" : ""}
                `}
                >
                  <Icon size={16} />
                </div>

                <div
                  className={`
                  absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                  text-xs font-semibold tracking-wider
                  transition-all duration-700 ease-out will-change-transform backface-hidden
                  ${isExpanded ? "text-foreground scale-125" : "text-muted-foreground"}
                `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card
                    className="absolute top-20 left-1/2 -translate-x-1/2 w-64 bg-background/95 backdrop-blur-lg border-border shadow-xl overflow-visible animate-in fade-in zoom-in-95 duration-1000 ease-out will-change-transform backface-hidden"
                    style={{ transform: "translate3d(-50%, 0, 0)" }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-border"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-xs ${getStatusStyles(
                            item.status,
                          )}`}
                        >
                          {item.status === "completed"
                            ? "COMPLETE"
                            : item.status === "in-progress"
                              ? "IN PROGRESS"
                              : "PENDING"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      <p>{item.content}</p>

                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1" />
                            Impact Level
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="flex items-center mb-2">
                            <Link
                              size={10}
                              className="text-muted-foreground mr-1"
                            />
                            <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                              Connected Features
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId,
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-xs hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="ml-1 text-muted-foreground"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
