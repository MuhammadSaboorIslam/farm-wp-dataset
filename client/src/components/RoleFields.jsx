const VEHICLES = [
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'rickshaw', label: 'Rickshaw' },
  { value: 'car', label: 'Car / van' },
]

export function Optional() {
  return <span className="text-gray-400 font-normal"> (optional)</span>
}

function RoleFields({ role, field, signup }) {
  return (
    <>
      {role === 'customer' && (
        <fieldset className="border-t border-gray-200 pt-4 mt-2">
          <legend className="text-sm font-semibold text-gray-700 pr-2">
            Delivery details
            <Optional />
          </legend>
          {signup && <p className="muted mb-3">Saves you typing them at checkout.</p>}
          <label className="label">
            Phone
            <input className="input" {...field('phone')} placeholder="03001234567" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
            <label className="label sm:col-span-2">
              Address
              <input className="input" {...field('address')} placeholder="House, street, area" />
            </label>
            <label className="label">
              City
              <input className="input" {...field('city')} placeholder="Lahore" />
            </label>
          </div>
        </fieldset>
      )}

      {role === 'farmer' && (
        <fieldset className="border-t border-gray-200 pt-4 mt-2">
          <legend className="text-sm font-semibold text-gray-700 pr-2">Your farm</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <label className="label">
              Farm name
              <input className="input" {...field('farmName')} placeholder="e.g. Green Valley Farm" />
            </label>
            <label className="label">
              Location (city)
              <input className="input" {...field('location')} placeholder="e.g. Lahore" />
            </label>
            <label className="label">
              Farm size in acres
              <Optional />
              <input
                type="number"
                min="0"
                step="0.5"
                className="input"
                {...field('farmSize')}
                placeholder="e.g. 12"
              />
            </label>
            <label className="label">
              Phone
              <Optional />
              <input className="input" {...field('phone')} placeholder="03001234567" />
            </label>
          </div>
          <label className="label">
            What do you grow?
            <Optional />
            <input className="input" {...field('crops')} placeholder="e.g. Tomatoes, spinach, strawberries" />
          </label>
          <label className="label">
            About your farm
            <Optional />
            <textarea rows="3" className="input" {...field('bio')} />
          </label>
          <p className="muted mb-3">
            {signup ? 'An admin checks every farm before it can list products. ' : ''}Your phone is only shown
            to the admin.
          </p>
        </fieldset>
      )}

      {role === 'rider' && (
        <fieldset className="border-t border-gray-200 pt-4 mt-2">
          <legend className="text-sm font-semibold text-gray-700 pr-2">Delivery details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <label className="label">
              Phone
              <input className="input" {...field('phone')} placeholder="03001234567" />
            </label>
            <label className="label">
              Vehicle
              <select className="input" {...field('vehicle')}>
                {VEHICLES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="label">
            City you deliver in
            <Optional />
            <input className="input" {...field('city')} placeholder="e.g. Lahore" />
          </label>
        </fieldset>
      )}
    </>
  )
}

export default RoleFields
