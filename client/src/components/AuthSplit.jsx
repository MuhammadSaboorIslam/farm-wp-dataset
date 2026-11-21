const CAPTIONS = {
  login: {
    title: 'Welcome back to the farm.',
    text: 'Your orders, farms and deliveries are where you left them.',
  },
  forgot: { title: 'Happens to everyone.', text: 'We will email you a link to choose a new password.' },
  reset: { title: 'Almost back in.', text: 'Pick a new password and you are good to go.' },
  pick: {
    title: 'Fresh from the farm, straight to your door.',
    text: 'Farmers sell directly to you. No middlemen, picked the day before delivery.',
  },
  customer: {
    title: 'Food that was in the field yesterday.',
    text: 'Order from farms near you and pay cash when it arrives.',
  },
  farmer: {
    title: 'Your harvest, your price.',
    text: 'List what you grow and sell straight to the people who eat it.',
  },
  rider: {
    title: 'Deliver fresh, earn per trip.',
    text: 'Pick up from farms and drop off across your city.',
  },
}

const POINTS = ['No middlemen', 'Cash on delivery', 'Verified farms']

function AuthSplit({ mode, children }) {
  const caption = CAPTIONS[mode] || CAPTIONS.pick
  return (
    <div className="auth-split">
      <aside className="auth-art">
        <img
          src="/img/auth-field.jpg"
          alt="Path through a green rice field"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/90 via-green-900/30 to-transparent"></div>
        <div key={mode} className="absolute bottom-0 left-0 right-0 p-10 lg:p-14 text-white">
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight max-w-md rise">{caption.title}</h2>
          <p className="text-green-100 mt-3 max-w-md rise">{caption.text}</p>
          <ul className="flex flex-wrap gap-2 mt-6">
            {POINTS.map((p) => (
              <li key={p} className="rise text-xs font-medium bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="auth-side flex justify-center px-4 py-8 sm:px-6 md:px-10 lg:px-16 md:py-12 md:items-center">
        <div className="auth-card w-full max-w-md">{children}</div>
      </section>
    </div>
  )
}

export default AuthSplit
