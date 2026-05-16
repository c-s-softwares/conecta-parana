enum Flavor { dev, staging, prod }

class Environment {
  Environment._();

  static late Flavor flavor;
  static const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  static void initialize(Flavor f) {
    flavor = f;
  }

  static String get apiBaseUrl {
    if (_apiBaseUrl.isNotEmpty) return _apiBaseUrl;

    const devUrl = 'http://10.0.2.2:3000';
    const stagingUrl = 'https://api-staging.exemplo.com.br';
    const prodUrl = 'https://api.exemplo.com.br';

    switch (flavor) {
      case Flavor.dev:
        return devUrl;
      case Flavor.staging:
        return stagingUrl;
      case Flavor.prod:
        return prodUrl;
    }
  }

  static String get name      => flavor.name.toUpperCase();
  static bool   get isDev     => flavor == Flavor.dev;
  static bool   get isStaging => flavor == Flavor.staging;
  static bool   get isProd    => flavor == Flavor.prod;
}
