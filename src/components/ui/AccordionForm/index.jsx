import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import Button2 from "../Button2/";

const AccordionForm = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const adjustHeight = () => {
      if (contentRef.current) {
        if (isOpen) {
          // Ajustar la altura al contenido total
          contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
        } else {
          // Colapsar la altura a 0
          contentRef.current.style.maxHeight = "0px";
        }
      }
    };

    // Ajustar la altura inicialmente y cada vez que el contenido cambie
    adjustHeight();

    // Escuchar cambios en el tamaño del contenido y ajustar
    const resizeObserver = new ResizeObserver(adjustHeight);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
    };
  }, [isOpen, children]);

  return (
    <div className={`${isOpen ? "m-2" : ""} accordion-item h-max border w-full bg-neutral-bg border-gray-300 rounded shadow-sm`}>
      <div
        className="accordion-header bg-blue-default rounded px-4 py-3 cursor-pointer flex justify-between items-center"
        onClick={toggleAccordion}
      >
        <h3 className="text-xl text-neutral-bg font-semibold">{title}</h3>
        <Button2 className="text-xl bg-transparent text-neutral-bg">
          <ChevronDown
            className={`${isOpen ? "rotate-180" : ""} transition-transform duration-300`}
            size={30}
            strokeWidth={3}
          />
        </Button2>
      </div>
      <div
        ref={contentRef}
        className={`${isOpen ? "my-4 py-4 h-auto" : ""}accordion-content px-4 overflow-hidden transition-max-height duration-300 ease-in-out`}
        style={{ maxHeight: "0px" }}
      >
        {children}
      </div>
    </div>
  );
};

export default AccordionForm;
