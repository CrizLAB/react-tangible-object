import React, { useEffect, useRef, useState } from "react";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useTangibleObjectDataStore } from "./useTangibleObjectDataStore";

interface TOCalibrationProps {
  idTO?: string;
  simulatorKey?: string;
}

export const TOCalibration: React.FC<TOCalibrationProps> = ({
  idTO,
  simulatorKey,
}: TOCalibrationProps) => {
  const [dist1Avg, setDist1Avg] = useState(0);
  const [dist2Avg, setDist2Avg] = useState(0);
  const [dist3Avg, setDist3Avg] = useState(0);

  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [aborted, setAborted] = useState(false);

  const progressToReach = 1000;
  const addTangibleObjectData = useTangibleObjectDataStore(
    (state) => state.addTangibleObjectData
  );

  // Mutable references for performance
  const dist1ListRef = useRef<number[]>([]);
  const dist2ListRef = useRef<number[]>([]);
  const dist3ListRef = useRef<number[]>([]);
  const touchListRef = useRef<TouchList | null>(null);

  const touchARef = useRef<React.Touch | null>(null);
  const touchBRef = useRef<React.Touch | null>(null);
  const touchCRef = useRef<React.Touch | null>(null);

  // 🖐️ Touch listener setup
  useEffect(() => {
    const handleTouch = (event: TouchEvent) => {
      touchListRef.current = event.touches;
    };

    document.addEventListener("touchmove", handleTouch, { passive: false });
    document.addEventListener("touchstart", handleTouch, { passive: false });
    document.addEventListener("touchend", handleTouch, { passive: false });

    return () => {
      document.removeEventListener("touchmove", handleTouch);
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("touchend", handleTouch);
    };
  }, []);

  useEffect(() => {
    let animationFrame: number;

    const updateTouches = () => {
      const touchList = touchListRef.current;
      if (!touchList) {
        animationFrame = requestAnimationFrame(updateTouches);
        return;
      }

      if (touchList.length > 3) {
        animationFrame = requestAnimationFrame(updateTouches);
        return;
      }

      if (touchList.length <= 2) {
        if (started) setAborted(true);
        animationFrame = requestAnimationFrame(updateTouches);
        return;
      }

      if (aborted) {
        animationFrame = requestAnimationFrame(updateTouches);
        return;
      }

      if (!started) setStarted(true);

      for (let i = 0; i < touchList.length; i++) {
        const touch = touchList.item(i);
        if (!touch) continue;

        if (touchARef.current?.identifier === touch.identifier) {
          touchARef.current = touch;
          continue;
        }
        if (touchBRef.current?.identifier === touch.identifier) {
          touchBRef.current = touch;
          continue;
        }
        if (touchCRef.current?.identifier === touch.identifier) {
          touchCRef.current = touch;
          continue;
        }

        if (!touchARef.current) {
          touchARef.current = touch;
          continue;
        }
        if (!touchBRef.current) {
          touchBRef.current = touch;
          continue;
        }
        if (!touchCRef.current) {
          touchCRef.current = touch;
          continue;
        }
      }

      const A = touchARef.current;
      const B = touchBRef.current;
      const C = touchCRef.current;

      if (A && B && C && progress < progressToReach) {
        const dist1 = Math.hypot(A.clientX - B.clientX, A.clientY - B.clientY);
        const dist2 = Math.hypot(B.clientX - C.clientX, B.clientY - C.clientY);
        const dist3 = Math.hypot(C.clientX - A.clientX, C.clientY - A.clientY);

        dist1ListRef.current.push(dist1);
        dist2ListRef.current.push(dist2);
        dist3ListRef.current.push(dist3);
      }

      animationFrame = requestAnimationFrame(updateTouches);
    };

    animationFrame = requestAnimationFrame(updateTouches);
    return () => cancelAnimationFrame(animationFrame);
  }, [started, aborted, progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      const len = Math.max(
        dist1ListRef.current.length,
        dist2ListRef.current.length,
        dist3ListRef.current.length
      );

      if (len !== progress) setProgress(len);

      if (len > 0) {
        const avg = (arr: number[]) =>
          arr.reduce((a, b) => a + b, 0) / arr.length;

        setDist1Avg(avg(dist1ListRef.current));
        setDist2Avg(avg(dist2ListRef.current));
        setDist3Avg(avg(dist3ListRef.current));
      }

      if (len >= progressToReach) {
        /*console.log({
          dist1: dist1Avg,
          dist2: dist2Avg,
          dist3: dist3Avg,
        });*/
      }
    }, 100);

    return () => clearInterval(interval);
  }, [progress, dist1Avg, dist2Avg, dist3Avg]);

  function textInsideCircle() {
    if (progress >= progressToReach) {
      return (
        <p style={{ fontSize: 20, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
          <strong>Done!</strong>
          <br />
          Calibration values were printed in the console!
        </p>
      );
    } else if (aborted) {
      return (
        <p style={{ fontSize: 20, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
          Tangible object was lifted.
          <br />
          <strong>Restart needed.</strong>
        </p>
      );
    } else if (started) {
      return (
        <p style={{ fontSize: 20, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
          Keep rotating and moving the object to calibrate
        </p>
      );
    } else {
      return (
        <p style={{ fontSize: 20, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
          Put a tangible object <strong>here</strong>
          <br /> to start the calibration
        </p>
      );
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "60vh", height: "60vh" }}>
        <CircularProgressbarWithChildren
          value={progress}
          maxValue={progressToReach}
          styles={buildStyles({
            rotation: 0.25,
            strokeLinecap: "butt",
            pathTransitionDuration: 0.5,
            pathColor: `rgba(62, 152, 199, ${progress / progressToReach})`,
            trailColor: "#d6d6d6",
          })}
        >
          <div>{textInsideCircle()}</div>
        </CircularProgressbarWithChildren>
      </div>

      <p
        style={{
          fontSize: 16,
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        Dist 1: {dist1Avg.toFixed(2)}, Dist 2: {dist2Avg.toFixed(2)}, Dist 3:{" "}
        {dist3Avg.toFixed(2)}
      </p>

      {(progress >= progressToReach || aborted) && (
        <div
          style={{
            fontSize: 20,
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
          }}
        >
          <p>
            You can add this tangible object data by filling its ID in the{" "}
            <strong>Controls</strong> below and clicking the button.
          </p>
          <button
            style={{
              width: 400,
              height: 40,
              fontSize: 20,
              fontFamily: "Arial, sans-serif",
              textAlign: "center",
            }}
            onClick={() => {
              if (idTO !== undefined) {
                addTangibleObjectData({
                  distAB: dist1Avg,
                  distBC: dist2Avg,
                  distCA: dist3Avg,
                  id: idTO,
                  simulatorKey: simulatorKey,
                });
              }
            }}
          >
            Add calibrated object
          </button>
        </div>
      )}
    </div>
  );
};
