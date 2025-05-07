interface FormProgressProps {
    currentStage: number
    totalStages: number
    steps: { name: string }[]
  }
  
  export default function FormProgress({ currentStage, totalStages, steps }: FormProgressProps) {
    return (
      <div className="w-full mt-4">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`text-sm font-medium transition-colors ${
                index === currentStage ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {step.name}
            </div>
          ))}
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStage + 1) / totalStages) * 100}%` }}
          ></div>
        </div>
      </div>
    )
  }
  