import React, { useState, useRef, useEffect } from "react";

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [showCameraFeed, setShowCameraFeed] = useState<boolean>(true);
  const [flash, setFlash] = useState<boolean>(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16 / 9);
  const frameImage = "./birthday-photobooth/assets/frame.png";
  // const frameImage = "birthday-photobooth/assets/frame.png";

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          alert("Please allow camera access.");
        });
    } else {
      alert("Your browser does not support camera access.");
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isCapturing && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0 && isCapturing) {
      capturePhoto();
      if (capturedCount < 3) {
        setCountdown(5);
        setCapturedCount((prev) => prev + 1);
      } else {
        setIsCapturing(false);
        setShowCameraFeed(false);
        stopCamera();
      }
    }
  }, [isCapturing, countdown, capturedCount]);

  const overlayImages = [
    "./birthday-photobooth/assets/pose1.png",
    "./birthday-photobooth/assets/pose2.png",
    "./birthday-photobooth/assets/pose3.png",
    "./birthday-photobooth/assets/pose4.png",
  ];

  useEffect(() => {
    overlayImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        const containerWidth = videoRef.current.clientWidth;
        const containerHeight = videoRef.current.clientHeight;

        const scale = Math.max(
          containerWidth / videoWidth,
          containerHeight / videoHeight
        );

        const cropWidth = containerWidth / scale;
        const cropHeight = containerHeight / scale;
        const cropX = (videoWidth - cropWidth) / 2;
        const cropY = (videoHeight - cropHeight) / 2;

        canvas.width = containerWidth;
        canvas.height = containerHeight;

        context.save();
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);

        context.drawImage(
          videoRef.current,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          containerWidth,
          containerHeight
        );
        context.restore();

        // 🔵 Draw the correct overlay image (in order)
        const overlay = new Image();
        overlay.src = overlayImages[capturedCount];
        overlay.onload = () => {
          context.drawImage(overlay, 0, 0, containerWidth, containerHeight); // adjust position/size if needed

          const photoUrl = canvas.toDataURL("image/png");
          setPhotos((prevPhotos) => [...prevPhotos, photoUrl]);

          setFlash(true);
          setTimeout(() => setFlash(false), 100);
        };
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const containerWidth = videoRef.current.clientWidth;
      const containerHeight = videoRef.current.clientHeight;

      const scale = Math.max(
        containerWidth / videoWidth,
        containerHeight / videoHeight
      );

      videoRef.current.style.transform = `scale(${scale}) scaleX(-1)`;
      videoRef.current.style.objectFit = "cover";

      const aspectRatio = videoWidth / videoHeight;
      setVideoAspectRatio(aspectRatio);
    }
  }, [videoRef]);

  const startCountdown = () => {
    setIsCapturing(true);
    setCapturedCount(0);
    setPhotos([]);
    setCountdown(5);
    setShowCameraFeed(true);
  };

  const saveImageWithFrame = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        const frame = new Image();
        frame.src = frameImage;

        frame.onload = () => {
          canvas.width = frame.width;
          canvas.height = frame.height;

          context.drawImage(frame, 0, 0);

          const photoWidth = 577;
          const photoHeight = 408;
          const gap = 57;
          const startY = 57;

          photos.forEach((photo, index) => {
            const x = (frame.width - photoWidth) / 2;
            const y = startY + index * (photoHeight + gap);

            const img = new Image();
            img.src = photo;

            img.onload = () => {
              context.drawImage(img, x, y, photoWidth, photoHeight);

              if (index === photos.length - 1) {
                const date = new Date().toLocaleDateString();
                context.font = "bold 32px Arial";
                context.fillStyle = "white";
                context.textAlign = "center";

                const dateY = frame.height - 50;
                context.fillText(date, frame.width / 2, dateY);

                const finalImage = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = finalImage;
                link.download = "archive_photo.png";
                link.click();
              }
            };
          });
        };
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full bg-[#552583]">
      <div className="flex flex-col items-center">
        {showCameraFeed && (
          <div className="relative w-full max-w-[90vw] sm:max-w-[640px] aspect-video border-[6px] border-[#dde1dd] shadow-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-[1px]"
              style={{
                transform: "scaleX(-1)",
                aspectRatio: `${videoAspectRatio}`,
              }}
            />

            {/* Live overlay preview */}
            {isCapturing &&
              countdown > 0 &&
              capturedCount < overlayImages.length && (
                <img
                  src={overlayImages[capturedCount]}
                  alt="Live overlay"
                  className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                  style={{ zIndex: 5 }}
                />
              )}

            {/* Flash effect */}
            {flash && (
              <div
                className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-50"
                style={{ pointerEvents: "none", zIndex: 10 }}
              />
            )}
          </div>
        )}

        {flash && (
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-50"
            style={{ pointerEvents: "none", zIndex: 10 }}
          />
        )}

        {isCapturing && (
          <div className="flex space-x-30 mt-4">
            <div
              className="mt-4 text-2xl font-bold"
              style={{ color: "#FDB927" }}
            >
              {countdown} sec
            </div>
            <div className="mt-4 text-2xl font-bold">
              {capturedCount + 1} / 4
            </div>
          </div>
        )}

        {!isCapturing && photos.length < 4 && (
          <button
            onClick={startCountdown}
            className="mt-4 p-2 bg-blue-500 text-white rounded"
          >
            Take Photo
          </button>
        )}
      </div>

      {photos.length === 4 && (
        <div className="flex justify-center items-center w-full mt-4 flex-col">
          <div className="grid grid-cols-2 gap-4 justify-items-center w-full max-w-[95%] sm:max-w-[700px]">
            {photos.map((photo, index) => (
              <div key={index} className="w-full h-full flex justify-center">
                <img
                  src={photo}
                  alt={`Captured ${index}`}
                  className="w-full h-full object-cover border-6 border-[#dde1dd] rounded-[1px]"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center w-full mt-4 space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white rounded w-full sm:w-[200px] h-[50px]"
            >
              Take Again
            </button>
            <button
              onClick={saveImageWithFrame}
              className="bg-green-500 text-white text-base sm:text-lg md:text-xl text-ellipsis truncate rounded-lg px-4 py-2 w-full sm:w-[200px] h-[50px] hover:bg-green-600"
            >
              Download
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default Camera;
