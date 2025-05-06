interface FormProgressProps {
    currentStage: number
    totalStages: number
  }
  
  export default function FormProgress({ currentStage, totalStages }: FormProgressProps) {
    return (
      <div className="w-full mt-4">
        <div className="flex justify-between mb-2">
          {Array.from({ length: totalStages }, (_, i) => i + 1).map((stage) => (
            <div key={stage} className="text-sm font-medium">
              Stage {stage}
            </div>
          ))}
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStage / totalStages) * 100}%` }}
          ></div>
        </div>
      </div>
    )
  }
  