export const POST = async (req) => {
  console.log('webhook triggered!');

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
