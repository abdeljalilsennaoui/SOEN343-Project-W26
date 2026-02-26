import { Outlet } from 'react-router-dom';
import Spline from "@splinetool/react-spline";

function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden xl:flex xl:w-[60%] xl:min-h-screen">
        <Spline
            scene="https://prod.spline.design/kKasZU0pzsTq1CuO/scene.splinecode"
            className="w-full h-full"
        />
        <div className="absolute top-0 left-0 p-5 xl:text-white text-black font-bold text-4xl">
          CityFlow
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white p-8 min-h-screen">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
