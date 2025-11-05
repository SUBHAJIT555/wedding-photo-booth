// import printingVideo from "../assets/printing.webm";
import PropTypes from "prop-types";

const LoadingSwapping = ({ visibility, src }) => {
  return (
    <div style={{ display: visibility }} className="fixed  h-screen w-[100vw]">
      {/* <h1>hello</h1> */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="object-cover w-full h-full"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

LoadingSwapping.propTypes = {
  visibility: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
};

export default LoadingSwapping;
