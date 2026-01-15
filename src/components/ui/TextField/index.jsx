import React from "react";
import { Trash2 } from "lucide-react";

const TextField = ({ label, onDelete }) => {
  return (
    <div className="flex space-x-1.5 w-[320px] text-sm items-center">
        <div className={`pl-2 py-0.5 w-full pr-12 border border-amber-default rounded-md text-gray-700`}>
					{label}
        </div>
				<Trash2 className="text-gray-700 hover:text-error-border cursor-pointer" size={16} onClick={()=>onDelete()}/>
    </div>
  );
};

export default TextField;
