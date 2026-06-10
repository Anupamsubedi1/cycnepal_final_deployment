import VacancyForm from "@/components/admin/VacancyForm";

export default function CreateVacancyPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* <div>
        <h1 className="mb-2 text-3xl font-bold text-[#123451]">Create New Vacancy</h1>
        <p className="text-slate-600">
          Add a new job opening with custom application form fields.
        </p>
      </div> */}

      <VacancyForm />
    </div>
  );
}
