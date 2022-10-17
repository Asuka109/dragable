import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { useSpring, useSprings, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import _ from "lodash";
import { Portal } from "react-portal";

import styles from "./styles.module.css";

export interface DragableProps {
  plots?: HTMLElement[];
  onResolve?: (el: HTMLElement) => void;
}

export const useRefs = <T extends any>(refs: T[]) => {
  const _refs = useRef<T[]>([]);
  const bind = (instance: T) => _refs.current.push(instance);
  return [_refs, bind];
};

const calcDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
  const offsetX = pos2.x - pos1.x;
  const offsetY = pos2.y - pos1.y;
  return Math.sqrt(offsetX ** 2 + offsetY ** 2);
};

export const Dragable: React.FC<React.PropsWithChildren<DragableProps>> = ({ children, plots = [], onResolve }) => {
  const [style, api] = useSpring(() => ({ x: 0, y: 0 }));
  const selfRef = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLElement>();
  const bind = useDrag(({ active, cancel, movement: [x, y], ...args }) => {
    if (active) {
      return api.start({ x, y });
    }
    const self = selfRef.current;
    if (!self) {
      return api.start({ x: 0, y: 0 });
    }
    const selfRect = self.getBoundingClientRect();
    if (!target.current) {
      let minDistance = Number.POSITIVE_INFINITY;
      for (const plot of plots) {
        const plotRect = plot.getBoundingClientRect();
        const distance = calcDistance(plotRect, selfRect);
        if (distance < minDistance) {
          minDistance = distance;
          target.current = plot;
        }
      }
    }
    const el = target.current;
    if (el) {
      const elRect = { x: 224.5, y: 371.5 }; //el.getBoundingClientRect();
      const promises = api.start({ x: elRect.x - x, y: elRect.y - y });
      Promise.all(promises).then(() => {
        console.log(elRect, selfRect, x, y);
        debugger;
        onResolve?.(el);
        target.current = undefined;
        api.start({ x: 0, y: 0 });
      });
    } else {
      api.start({ x: 0, y: 0 });
    }
  }, {});
  return (
    <animated.div ref={selfRef} {...bind()} style={{ ...style, touchAction: "none" }}>
      {children}
    </animated.div>
  );
};

export default function App() {
  const plots = useRef<HTMLElement[]>([]).current;
  const [el, setEl] = React.useState<HTMLElement>();

  return (
    <>
      <div className="flex fill center" style={{ gap: 10 }}>
        <Portal node={el}>
          <Dragable plots={plots}>
            <div style={{ height: 100, width: 100, backgroundColor: "red" }}></div>
          </Dragable>
        </Portal>
        {_.times(4, (i) => (
          <div
            key={i}
            className={styles.plot}
            ref={(instance) => {
              if (instance) {
                plots.push(instance);
                setEl(instance);
              }
            }}
          />
        ))}
      </div>
    </>
  );
}
