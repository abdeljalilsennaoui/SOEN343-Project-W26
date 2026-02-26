import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Spline from "@splinetool/react-spline";

const XL_BREAKPOINT = 1280;

function useIsXl() {
  const [isXl, setIsXl] = useState(() => typeof window !== 'undefined' && window.innerWidth >= XL_BREAKPOINT);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
    const handler = () => setIsXl(mq.matches);
    mq.addEventListener('change', handler);
    handler();
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isXl;
}

function AuthLayout() {
  const isXl = useIsXl();

  return (
    <div className="min-h-screen flex">
      <div className={`${isXl ? 'flex w-[60%] min-h-screen' : 'hidden'} relative`}>
        {isXl && (
          <Spline
            key="spline-auth"
            scene="https://prod.spline.design/kKasZU0pzsTq1CuO/scene.splinecode"
            className="w-full h-full absolute inset-0"
          />
        )}
        <div className="absolute top-0 left-0 p-5 text-white font-bold text-4xl pointer-events-none z-10">
          CityFlow
        </div>
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-center bg-white p-8 min-h-screen">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
