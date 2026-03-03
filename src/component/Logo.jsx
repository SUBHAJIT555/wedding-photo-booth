import LogoImage from "../assets/logo/remix-logo.svg";
function Logo() {
  return (
    <div className="flex justify-center items-center">
      <img src={LogoImage} alt="Codecobble" className="w-[35vw] " />
    </div>
  );
}

export default Logo;
