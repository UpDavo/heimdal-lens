import { useEffect, useRef } from "react";
import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
} from "@snap/camera-kit";

function App() {
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const cameraKitRef = useRef(null);

  const data = [
    {
      name: "Hoodie",
      src: "img/image.jpg",
      id: "d924e6eb-9bea-47e1-9520-5dff43b514a2",
    },
    {
      name: "Short",
      src: "img/shorts.webp",
      id: "59750560887",
    },
    {
      name: "Canguro",
      src: "img/cangu.jpg",
      id: "49414230875",
    },
  ];

  useEffect(() => {
    let session;
    let cameraKit;

    const initCameraKit = async () => {
      try {
        const apiToken = import.meta.env.VITE_API_TOKEN;
        const lensGroupId = import.meta.env.VITE_LENS_GROUP_ID;
        const defaultLensId = data[0].id;

        cameraKit = await bootstrapCameraKit({ apiToken });
        cameraKitRef.current = cameraKit;

        const canvas = canvasRef.current;
        if (!canvas) return;

        session = await cameraKit.createSession({ liveRenderTarget: canvas });
        sessionRef.current = session;

        session.events.addEventListener("error", (event) => {
          console.error("Error en el Lens:", event.detail.error);
        });

        // Solicitar permisos de cámara
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const source = createMediaStreamSource(stream, {
          transform: Transform2D.MirrorX,
          cameraType: "front",
        });
        await session.setSource(source);

        const lens = await cameraKit.lensRepository.loadLens(
          defaultLensId,
          lensGroupId
        );
        await session.applyLens(lens);

        await session.play("live");
        console.log("¡El Lens está en ejecución!");
      } catch (error) {
        console.error("Error al inicializar Camera Kit:", error);
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          // El usuario no otorgó permisos de cámara o los ha denegado.
          // Aquí puedes mostrar un mensaje al usuario, por ejemplo:
          alert(
            "No se han concedido permisos para usar la cámara. Por favor, habilita el acceso y vuelve a cargar la página."
          );
        }
      }
    };

    initCameraKit();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.pause();
        sessionRef.current.removeLens();
      }
    };
  }, []);

  const handleLensChange = async (itemId, e) => {
    const img = e.currentTarget;
    img.classList.add("scale-90");
    setTimeout(() => {
      img.classList.remove("scale-90");
    }, 200);

    if (sessionRef.current && cameraKitRef.current) {
      try {
        const lensGroupId = import.meta.env.VITE_LENS_GROUP_ID;
        const lens = await cameraKitRef.current.lensRepository.loadLens(
          itemId,
          lensGroupId
        );
        await sessionRef.current.applyLens(lens);
        console.log("Lens cambiado a: ", itemId);
      } catch (error) {
        console.error("Error al cambiar el lens:", error);
      }
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      <div className="absolute bottom-0 left-0 w-full bg-white overflow-x-scroll flex items-center gap-4 shadow-lg p-4">
        {data.map((item) => (
          <div className="grid grid-cols-1" key={item.id}>
            <img
              key={item.id}
              src={item.src}
              alt={item.name}
              className="w-16 h-16 rounded-full border-2 border-gray-300 cursor-pointer transform transition-transform duration-150"
              onClick={(e) => handleLensChange(item.id, e)}
            />
            <p>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
