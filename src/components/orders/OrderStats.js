import { motion } from 'framer-motion';

/**
 * Order Statistics Component
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics object
 * @returns {JSX.Element} Order statistics component
 */
export default function OrderStats({ stats }) {
  const statItems = [
    {
      label: 'Total Pesanan',
      value: stats.total,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      label: 'Aktif',
      value: stats.active,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      label: 'Selesai',
      value: stats.completed,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      label: 'Menunggu',
      value: stats.pending,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      label: 'Dibatalkan',
      value: stats.cancelled,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
            <div>
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className={`text-2xl font-bold ${item.textColor}`}>
                {item.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 