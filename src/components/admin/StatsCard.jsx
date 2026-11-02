
export default function StatsCard({label, value, loading}) {

  return (
        
    <div className="w-full flex flex-col gap-4 items-start">
      <p className="text-md h-fit text-brand-muted">{label}</p>
      <p className="text-2xl font-medium text-brand-accent">
        {loading ? (
          <span className="text-brand-muted">...</span>
        ):(
          (value ?? 0).toLocaleString()
        )}
      </p>
    
    </div>
  
  );
}