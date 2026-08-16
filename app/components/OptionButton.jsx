const OptionButton = ({ option, selected, onChange }) => {
  return (
    <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-full cursor-pointer hover:border-Primary-500 transition-colors">
      <input
        type="radio"
        name="relationship-type"
        value={option}
        checked={selected === option}
        onChange={(e) => onChange(e.target.value)}
        className="w-4 h-4 text-Primary-500 border-gray-300 focus:ring-Primary-500"
      />
      <span className="text-gray-700">{option}</span>
    </label>
  );
};

export default OptionButton;
