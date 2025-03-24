export const formatSourceName = (source: string): string => {
  return source
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getYCombinatorDate = (date: string): string => {
  const ycDate = new Date(date);
  ycDate.setDate(ycDate.getDate() + 1);
  const year = ycDate.getFullYear().toString().slice(-2); // Get last 2 digits of year
  const month = ycDate.getMonth() + 1; // JavaScript months are 0-indexed
  console.log("YC date", ycDate);

  // Determine the batch based on month
  if (month === 1) return `W${year}`; // Winter batch (January)
  if (month === 4) return `X${year}`; // Spring batch (April)
  if (month === 6) return `S${year}`; // Summer batch (June)
  if (month === 9) return `F${year}`; // Fall batch (September)

  return 'Unknown Batch'; // For any other months
};
