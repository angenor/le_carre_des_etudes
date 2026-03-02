<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
    <div class="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 space-y-8">
      <h1 class="text-4xl font-bold text-gray-900 text-center">
        Le Carré des Études
      </h1>
      <p class="text-lg text-gray-600 text-center">
        Tailwind CSS est bien configuré !
      </p>

      <div class="grid grid-cols-3 gap-4">
        <div class="bg-blue-500 text-white rounded-lg p-4 text-center font-semibold">
          Blue
        </div>
        <div class="bg-emerald-500 text-white rounded-lg p-4 text-center font-semibold">
          Emerald
        </div>
        <div class="bg-purple-500 text-white rounded-lg p-4 text-center font-semibold">
          Purple
        </div>
      </div>

      <div class="flex justify-center">
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200">
          Bouton Test
        </button>
      </div>

      <p class="text-sm text-gray-400 text-center">
        Si vous voyez des couleurs et du style, Tailwind fonctionne correctement.
      </p>
    </div>
  </div>
</template>
