import { forwardRef, useImperativeHandle, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ZodObject } from "zod";

export interface MultiStepFormRef {
    handleNext: () => void;
    handleBack: () => void;
}

interface MultiStepFormProps {
    schema: ZodObject<any>
    methods: UseFormReturn<any>
    steps: { name: string, children: React.ReactNode }[]
    controls?: React.ReactNode;
    onSubmit: (data: any) => void;
}

const MultiStepForm = forwardRef<MultiStepFormRef, MultiStepFormProps>(
    ({ schema, methods, steps, controls, onSubmit }, ref) => {
      const schemaKeys: string[] = schema.keyof()._def.values;
      const numberOfFields = schemaKeys.length;
      if (numberOfFields !== steps.length)
        throw new Error("Amount of steps and fields in schema do not match");
  
      const [currentStep, setCurrentStep] = useState(0);
      const isLastStep = currentStep === steps.length - 1;
  
  const handleBack = () => {
      if (currentStep > 0) {
        const newStep = currentStep - 1;
        setCurrentStep(newStep);
      }
    };
  
    const handleNext = () => {
      if (!isLastStep) {
        const newStep = currentStep + 1;
        setCurrentStep(newStep);
      } else {
        // handleSubmit validates the data according to the schema, meaning if it is invalid it won't reach the onSubmit function or in our case, log in the console
        methods.handleSubmit(onSubmit)();
      }
    };
  
      useImperativeHandle(ref, () => {
        return {
          handleNext,
          handleBack
        };
      });
  
      return (
        <div className="w-full">
          {steps.map(
            (step, index) =>
              index === currentStep && <div key={index}>{step.children}</div>
          )}
          <div className="flex flex-row mt-4 w-full justify-between">
            {Array.isArray(controls) &&
              controls.map((control, index) => <div key={index}>{control}</div>)}
          </div>
        </div>
      );
    }
  );
  
  MultiStepForm.displayName = "MultiStepForm";
  
  export default MultiStepForm;
