import { useState } from "react";
import BlurText from "../components/BlurText";
import { useAuthStore } from "../Store";
import { Button, Space } from "antd";
import { NavLink } from "react-router-dom";
import DecryptedText from "../components/DecryptedText";
import ButtonWrapperAnimation from "../components/ButtonWrapperAnimation";
import { Role } from "../constants/roles";

export const Home = () => {
  const currentUserName = useAuthStore((state) => state.currentUserName);
  const role = useAuthStore((state) => state.currentUserRole);
  const [showButtons, setShowButtons] = useState(false);
  const handleAnimationComplete = () => {
    setShowButtons(true);
  };
  return (
    <div
      style={{
        width: "100%",
        height: "calc(100% - 200px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: 200,
        gap: 20,
        position: "absolute",
      }}
    >
      <BlurText
        text="Food Donation and Redistribution System (FDRS)"
        delay={150}
        animateBy="words"
        direction="top"
        onAnimationComplete={handleAnimationComplete}
        className="text-2xl mb-8"
      />
      {currentUserName || role == Role.Admin ? (
        <>
          <DecryptedText
            text={
              "Welcome \n" + (role == Role.Admin ? "Admin" : currentUserName)
            }
            speed={100}
            maxIterations={10}
            characters="ABCD1234!?"
            className="revealed"
            parentClassName="all-letters"
            encryptedClassName="encrypted"
            revealDirection="start"
            animateOn="view"
            sequential={true}
            style={{
              fontSize: "3rem",
            }}
          />
        </>
      ) : showButtons ? (
        <ButtonWrapperAnimation>
          <Space>
            <Button size="large" type="primary">
              <NavLink style={{ textDecoration: "none" }} to="/auth/login">
                Login
              </NavLink>
            </Button>
            <Button size="large">
              <NavLink style={{ textDecoration: "none" }} to="/auth/register">
                Register
              </NavLink>
            </Button>
          </Space>
        </ButtonWrapperAnimation>
      ) : (
        <></>
      )}
    </div>
  );
};
