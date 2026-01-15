import React from 'react';
import styled from 'styled-components';

const LoaderWord = () => {
  return (
    <StyledWrapper>
      <div className="textWrapper">
        <p className="text-lg">Cargando...</p>
        <div className="invertbox" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .textWrapper {
    height: fit-content;
    min-width: 3rem;
    width: fit-content;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: 0.25ch;
    position: relative;
    z-index: 0;
    color: black;
  }

  .invertbox {
    position: absolute;
    height: 100%;
    aspect-ratio: 1/1;
    left: 0;
    top: 0;
    border-radius: 20%;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: invert(100%);
    animation: move 3s ease-in-out infinite;
  }

  @keyframes move {
    50% {
      left: calc(100% - 1rem);
    }
  }`;

export default LoaderWord;