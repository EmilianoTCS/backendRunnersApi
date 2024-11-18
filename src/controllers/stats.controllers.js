import User from "../models/Users";
import Fee from "../models/Fee";
import Sale from "../models/Sale";

export const documentCount = async (req, res) => {
  try {
    const femaleCount = await User.countDocuments({ gender: "femenino" });
    const maleCount = await User.countDocuments({ gender: "masculino" });
    const totalEarns = await Fee.aggregate([
      {
        $group: {
          _id: { isPayed: "$isPayed" },
          total: {
            $sum: "$feePrice",
          },
        },
      },
    ]);

    const countRaces = await Sale.aggregate([
      {
        $group: {
          _id: { race: "$race", name: "$name" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    var data = {
      femaleUserCount: femaleCount,
      maleUserCount: maleCount,
      totalEarns: totalEarns,
      countRaces: countRaces,
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 1. Obtener el total de ventas
async function getTotalSales() {
  try {
    const count = await Sale.countDocuments();
    return {
      totalSales: count,
    };
  } catch (error) {
    console.error("Error al obtener total de ventas:", error);
    throw error;
  }
}

// 2. Obtener conteo de ventas agrupadas por raza
async function getSalesByRace() {
  try {
    const salesByRace = await Sale.aggregate([
      {
        $group: {
          _id: "$race",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
        },
      },
      {
        $project: {
          race: "$_id",
          count: 1,
          revenue: "$totalRevenue",
          _id: 0,
        },
      },
    ]);

    // Formatear la respuesta
    const formattedResult = {
      totalSales: 0,
      totalRevenue: 0,
      salesByRace: {},
    };

    salesByRace.forEach((sale) => {
      formattedResult.totalSales += sale.count;
      formattedResult.totalRevenue += sale.revenue;
      formattedResult.salesByRace[sale.race] = {
        count: sale.count,
        revenue: sale.revenue,
      };
    });

    return formattedResult;
  } catch (error) {
    console.error("Error al obtener las ventas por carrera:", error);
    throw error;
  }
}

// 3. Obtener ventas por fecha(s) con desglose por carrera
async function getSalesByDateRange(startDate, endDate = null) {
  try {
    // Si no se proporciona endDate, se asume que queremos consultar solo startDate
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(startDate);
    end.setHours(23, 59, 59, 999);

    const result = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            race: "$race",
            date: endDate
              ? {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$saleDate",
                  },
                }
              : null,
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
        },
      },
      {
        $group: {
          _id: endDate ? "$_id.date" : null,
          totalSales: { $sum: "$count" },
          totalRevenue: { $sum: "$totalRevenue" },
          salesByRace: {
            $push: {
              race: "$_id.race",
              count: "$count",
              revenue: "$totalRevenue",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Formatear la respuesta
    if (!result.length) {
      return {
        period: endDate ? `${startDate} al ${endDate}` : startDate,
        totalSales: 0,
        totalRevenue: 0,
        salesByRace: {},
        dailyBreakdown: endDate ? [] : undefined,
      };
    }

    // Si es consulta de un solo día
    if (!endDate) {
      const salesByRaceFormatted = {};
      result[0].salesByRace.forEach((sale) => {
        salesByRaceFormatted[sale.race] = {
          count: sale.count,
          revenue: sale.revenue,
        };
      });

      return {
        date: startDate,
        totalSales: result[0].totalSales,
        totalRevenue: result[0].totalRevenue,
        salesByRace: salesByRaceFormatted,
      };
    }

    // Si es consulta de un rango de fechas
    const formattedResult = {
      period: `${startDate} al ${endDate}`,
      totalSales: 0,
      totalRevenue: 0,
      salesByRace: {},
      dailyBreakdown: result.map((day) => {
        day.salesByRace.forEach((sale) => {
          // Acumular totales por raza
          if (!formattedResult.salesByRace[sale.race]) {
            formattedResult.salesByRace[sale.race] = {
              count: 0,
              revenue: 0,
            };
          }
          formattedResult.salesByRace[sale.race].count += sale.count;
          formattedResult.salesByRace[sale.race].revenue += sale.revenue;
        });

        // Acumular totales generales
        formattedResult.totalSales += day.totalSales;
        formattedResult.totalRevenue += day.totalRevenue;

        // Retornar el desglose diario
        return {
          date: day._id,
          totalSales: day.totalSales,
          totalRevenue: day.totalRevenue,
          salesByRace: day.salesByRace.reduce((acc, sale) => {
            acc[sale.race] = {
              count: sale.count,
              revenue: sale.revenue,
            };
            return acc;
          }, {}),
        };
      }),
    };

    return formattedResult;
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    throw error;
  }
}

// 4. Obtener suma total de precios (ingresos totales)
async function getTotalRevenue() {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    return {
      totalRevenue: result[0]?.totalRevenue || 0,
      totalSales: result[0]?.totalSales || 0,
    };
  } catch (error) {
    console.error("Error al obtener suma total de precios:", error);
    throw error;
  }
}

// Función principal que maneja la petición HTTP
export async function HistoricStats(req, res) {
  try {
    // Obtener fechas del body
    const { startDate, endDate } = req.body;

    // Validar que se proporcionen las fechas
    if (!startDate) {
      return res.status(400).json({
        status: 400,
        message: "Se requiere fecha inicial(startDate)",
        timestamp: new Date().toISOString(),
      });
    }

    // Validar formato de fechas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || (endDate && !dateRegex.test(endDate))) {
      return res.status(400).json({
        status: 400,
        message: "Formato de fecha inválido. Use YYYY-MM-DD",
        timestamp: new Date().toISOString(),
      });
    }

    // Ejecutar todas las consultas en paralelo
    const [
      totalSalesResult,
      salesByRaceResult,
      dateRangeResult,
      totalRevenueResult,
    ] = await Promise.all([
      getTotalSales(),
      getSalesByRace(),
      getSalesByDateRange(startDate, endDate),
      getTotalRevenue(),
    ]);

    // Construir respuesta unificada
    const response = {
      status: 200,
      message: "Datos recuperados exitosamente",
      data: {
        generalMetrics: {
          historic: {
            totalSales: totalSalesResult.totalSales,
            totalRevenue: totalRevenueResult.totalRevenue,
          },
          byRace: {
            totalSales: salesByRaceResult.totalSales,
            totalRevenue: salesByRaceResult.totalRevenue,
            distribution: salesByRaceResult.salesByRace,
          },
        },
        periodMetrics: dateRangeResult,
      },
      // timestamp: new Date().toISOString(),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error en main:", error);
    return res.status(500).json({
      status: 500,
      message: "Error al recuperar los datos",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}


