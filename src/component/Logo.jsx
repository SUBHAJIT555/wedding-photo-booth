import LogoImage from "../assets/logo/Sprinklrlogo1.svg";
function Logo() {
  return (
    <div className="flex justify-center items-center">
      <img src={LogoImage} alt="Codecobble" className="w-[50vw]" />
    </div>
  );
}

export default Logo;
