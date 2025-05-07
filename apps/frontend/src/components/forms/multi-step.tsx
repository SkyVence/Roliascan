import { forwardRef, useImperativeHandle, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ZodError, ZodObject } from "zod";
import { toast } from "sonner";

export interface MultiStepFormRef {
    handleNext: () => void;
    handleBack: () => void;
    currentStep: number;
}

interface MultiStepFormProps {
    schema: ZodObject<any>
    methods: UseFormReturn<any>
    steps: { name: string, children: React.ReactNode }[]
    controls?: React.ReactNode;
    onSubmit: (data: any) => void;
    onStepChange?: (step: number) => void;
}

const MultiStepForm = forwardRef<MultiStepFormRef, MultiStepFormProps>(
    ({ schema, methods, steps, controls, onSubmit, onStepChange }, ref) => {
      const schemaKeys: string[] = schema.keyof()._def.values;
      const numberOfFields = schemaKeys.length;
      if (numberOfFields !== steps.length)
        throw new Error("Amount of steps and fields in schema do not match");
  
      const [currentStep, setCurrentStep] = useState(0);
      const isLastStep = currentStep === steps.length - 1;
  
      const validateCurrentStep = async () => {
        const currentStepKey = schemaKeys[currentStep];
        const currentStepSchema = schema.shape[currentStepKey];
        
        try {
          const formData = methods.getValues();
          await currentStepSchema.parseAsync(formData[currentStepKey]);
          return true;
        } catch (error) {
          if (error instanceof ZodError) {
            toast.error(error.issues[0].message || "An error occurred");
          }
          return false;
        }
      };
  
      const handleBack = () => {
          if (currentStep > 0) {
            const newStep = currentStep - 1;
            setCurrentStep(newStep);
            onStepChange?.(newStep);
          }
        };
      
        const handleNext = async () => {
          if (!isLastStep) {
            const isValid = await validateCurrentStep();
            if (isValid) {
              const newStep = currentStep + 1;
              setCurrentStep(newStep);
              onStepChange?.(newStep);
            }
          } else {
            const isValid = await validateCurrentStep();
            if (isValid) {
              methods.handleSubmit(onSubmit)();
            }
          }
        };
  
      useImperativeHandle(ref, () => {
        return {
          handleNext,
          handleBack,
          currentStep
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
