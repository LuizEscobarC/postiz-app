export const brandName = () => {
  return (
    process.env.BRAND_NAME || (process.env.IS_GENERAL ? 'Postiz' : 'Gitroom')
  );
};
